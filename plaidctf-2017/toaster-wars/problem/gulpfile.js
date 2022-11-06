"use strict";

let es2015        = require("babel-preset-es2015");
let gulp          = require("gulp");
let path          = require("path");
let merge         = require("merge-stream");
let notifier      = require("node-notifier");
let rollup        = require("rollup").rollup;
let sorcery       = require("sorcery");

let $             = require("gulp-load-plugins")({ pattern: ["gulp-*", "gulp.*"] });

const SERVER_TS_CONFIG = {
	"emitDecoratorMetadata": true,
	"experimentalDecorators": true,
	"target": "es6",
	"module": "commonjs",
	"moduleResolution": "node",
	"removeComments": true,
	"sourceMap": false,
	"noImplicitAny": true
};

const CLIENT_TS_CONFIG = {
	"emitDecoratorMetadata": true,
	"experimentalDecorators": true,
	"target": "es6",
	"moduleResolution": "node",
	"removeComments": true,
	"sourceMap": false,
	"noImplicitAny": true
};

const MONITOR_TS_CONFIG = {
	"emitDecoratorMetadata": true,
	"experimentalDecorators": true,
	"target": "es6",
	"moduleResolution": "node",
	"removeComments": true,
	"sourceMap": false,
	"noImplicitAny": true
};

const EXTERNAL_DEPENDENCY_LOOPUP = {
	"pixi.js": "PIXI",
	"pixi-multistyle-text": false,
	"webfontloader": "window.WebFont"
};

const CLIENT_LIB_FILES = [
	"node_modules/howler/dist/howler.js",
	"node_modules/keymaster/keymaster.js",
	"node_modules/pixi-multistyle-text/dist/pixi-multistyle-text.js",
	"node_modules/pixi-tilemap/bin/pixi-tilemap.js",
	"node_modules/pixi.js/dist/pixi.js",
	"node_modules/stats.js/build/stats.min.js",
	"node_modules/webfontloader/webfontloader.js"
];

const MONITOR_LIB_FILES = [
	"node_modules/webfontloader/webfontloader.js"
];

let src     = (...dirs) => dirs.map((dir) => path.join("src", dir));
let test    = (...dirs) => dirs.map((dir) => path.join("test", dir));
let build   = (dir) => path.join("build", dir);
let map     = "map";
let notify  = (message) => notifier.notify({
			title: "Dungeonkit Build Notice",
			message: message
		});

gulp.task("default", ["client", "server", "monitor", "test"]);

gulp.task("watch", ["default", "watch-server", "watch-client", "watch-monitor", "watch-test"]);

gulp.task("watch-client", () => {
	gulp.watch(src("client/**/*.ts", "types/**/*.*", "common/**/*.*"), ["client-ts"]);
	gulp.watch(src("client/*.html"), ["client-html"]);
	gulp.watch(src("client/assets/**/*.*"), ["client-assets"]);
	gulp.watch(src("client/css/**/*.*"), ["client-css"]);
	gulp.watch(src("client/lib/*.js"), ["client-lib"]);
});

gulp.task("client", ["client-html", "client-assets", "client-ts", "client-lib", "client-css"]);

gulp.task("client-assets", () =>
	gulp.src(src("client/assets/**/*.*"))
		.pipe(gulp.dest(build("client/assets"))));

gulp.task("client-css", () =>
	gulp.src(src("client/css/**/*.*"))
		.pipe(gulp.dest(build("client/css"))));

gulp.task("client-html", () =>
	gulp.src(src("client/*.html"))
		.pipe(gulp.dest(build("client"))));

gulp.task("client-ts", () =>
	gulp.src(src("{client/ts/**/*.ts,common/**/*.ts}"))
		.pipe($.sourcemaps.init())
		.pipe($.typescript(CLIENT_TS_CONFIG))
		.pipe($.sourcemaps.write(map))
		.pipe($.intermediate({ output: "out" }, (dir, cb) => {
			rollup({
				entry: path.join(dir, "client/ts/client.js"),
				format: "umd",
				external: Object.keys(EXTERNAL_DEPENDENCY_LOOPUP)
			})
				.then((bundle) =>
					bundle.write({
						dest: path.join(dir, "out/client.js"),
						sourceMap: true
			}))
				.then(() => sorcery.load(path.join(dir, "out/client.js")))
				.then((chain) => chain.write(path.join(dir, "out/client.js")))
				.catch((e) => console.error(dir, "\n", e))
				.then(() => cb());
		}))
		.pipe($.ignore.exclude("*.map"))
		.pipe($.sourcemaps.init({ loadMaps: true }))
		.pipe($.sourcemaps.write(map))
		.pipe($.replace(/import (\{.*\}) from '([^\s;]*)'/g, (_, target, source) => EXTERNAL_DEPENDENCY_LOOPUP[source] ? `const ${target} = ${EXTERNAL_DEPENDENCY_LOOPUP[source]}` : ``))
		.pipe($.replace(/import \* as ([^\s]*) from '([^\s;]*)'/g, (_, target, source) => EXTERNAL_DEPENDENCY_LOOPUP[source] ? `const ${target} = ${EXTERNAL_DEPENDENCY_LOOPUP[source]}` : ``))
		.pipe($.replace(/import .* from '([^\s;]*)'/g, (_, target, source) => ``))
		.pipe(gulp.dest(build("client/js"))
			.on("end", () => notify("The client is ready!"))));

gulp.task("client-lib", () =>
	gulp.src(CLIENT_LIB_FILES)
		.pipe($.sourcemaps.init({ loadMaps: true }))
		.pipe($.sourcemaps.write(map))
		.pipe(gulp.dest(build("client/lib"))));

gulp.task("watch-monitor", () => {
	gulp.watch(src("monitor/ts/**/*.ts", "types/**/*.*"), ["monitor-ts"]);
	gulp.watch(src("monitor/index.html"), ["monitor-html"]);
});

gulp.task("monitor", ["monitor-ts", "monitor-html", "monitor-lib"]);

gulp.task("monitor-ts", () =>
	gulp.src(src("monitor/ts/**/*.ts"))
		.pipe($.sourcemaps.init())
		.pipe($.typescript(MONITOR_TS_CONFIG))
		.pipe($.sourcemaps.write(map))
		.pipe(gulp.dest(build("monitor/js"))
			.on("end", () => notify("The monitor is ready!"))));

gulp.task("monitor-html", () =>
	gulp.src(src("monitor/index.html"))
	    .pipe(gulp.dest(build("monitor"))));

gulp.task("monitor-lib", () =>
	gulp.src(MONITOR_LIB_FILES)
		.pipe($.sourcemaps.init({ loadMaps: true }))
		.pipe($.sourcemaps.write(map))
		.pipe(gulp.dest(build("monitor/lib"))));

gulp.task("watch-server", () => {
	gulp.watch(src("server/**/*.ts", "index.ts", "types/**/*.*", "common/**/*.*"), ["server"])
});

gulp.task("server", () =>
	gulp.src(src("{server/**/*.ts,index.ts,common/**/*.ts}"))
		.pipe($.sourcemaps.init())
		.pipe($.typescript(SERVER_TS_CONFIG))
		.pipe($.sourcemaps.write(map))
		.pipe(gulp.dest(build("")).on("end", () => notify("The server is ready!"))));

gulp.task("watch-test", () => {
	gulp.watch(test("**/*.ts"), ["test"]);
});

gulp.task("test", () =>
	gulp.src(test("**/*.ts"))
		.pipe($.sourcemaps.init())
		.pipe($.typescript(SERVER_TS_CONFIG))
		.pipe($.replace("../../src/", "../../"))
		.pipe($.sourcemaps.write(map))
		.pipe(gulp.dest(build("test"))));