MOVE_TIME = 300;
HURT_TIME = 750;

animations = {
	"toaster-walk": [
		{ frame: dir("toaster-walk-%d-0"), length: 70, delta: 0 },
		{ frame: dir("toaster-walk-%d-1"), length: 60, delta: 0 },
		{ frame: dir("toaster-walk-%d-2"), length: 50, delta: 0 },
		{ frame: dir("toaster-walk-%d-0"), length: 20, delta: 0 }
	],
	"toaster-idle": [
		{ frame: dir("toaster-walk-%d-0"), length: 600, delta: 0 },
		{ frame: dir("toaster-walk-%d-1"), length: 100, delta: 0 },
		{ frame: dir("toaster-walk-%d-2"), length: 100, delta: 0 },
		{ frame: dir("toaster-walk-%d-1"), length: 100, delta: 0 }
	],
	"toaster-hurt": [
		{ frame: dir("toaster-hurt-%d"), length: HURT_TIME, delta: -.2 }
	],
	"toaster-defeat": [
		{ frame: dir("toaster-hurt-%d"), length: 150, delta: -.2 },
		{ frame: pas("empty"), length: 150, delta: -.2 },
		{ frame: dir("toaster-hurt-%d"), length: 150, delta: -.2 },
		{ frame: pas("empty"), length: 150, delta: -.2 }
	],
	"toaster-attack-tackle": [
		{ frame: dir("toaster-walk-%d-0"), length: 25, delta: 0 },
		{ frame: dir("toaster-walk-%d-2"), length: 25, delta: .1 },
		{ frame: dir("toaster-walk-%d-2"), length: 25, delta: .2 },
		{ frame: dir("toaster-walk-%d-2"), length: 25, delta: .3 },
		{ frame: dir("toaster-walk-%d-1"), length: 25, delta: .4 },
		{ frame: dir("toaster-walk-%d-1"), length: 25, delta: .5 },
		{ frame: dir("toaster-walk-%d-1"), length: 50, delta: .6, hitFrame: true },
		{ frame: dir("toaster-walk-%d-0"), length: 25, delta: .4 },
		{ frame: dir("toaster-walk-%d-0"), length: 25, delta: .2 },
		{ frame: dir("toaster-walk-%d-0"), length: 100, delta: 0 },
	],
	"toaster-attack-spinshock": [
		{ frame: rot("toaster-spinshock-%d", 0), length: 80, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 7), length: 50, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 6), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 5), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 4), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 3), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 2), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 1), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 0), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 7), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 6), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 5), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 4), length: 30, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 3), length: 50, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 2), length: 80, delta: 0 },
		{ frame: rot("toaster-spinshock-%d", 1), length: 80, delta: 0, hitFrame: true },
		{ frame: rot("toaster-spinshock-%d", 0), length: 140, delta: 0 }
	],
	"toaster-attack-overheat": [
		{ frame: dir("toaster-overheat-%d-0"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-1"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-2"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-3"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-4"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-2"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-3"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-4"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-2"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-3"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-4"), length: 45, delta: 0 },
		{ frame: dir("toaster-overheat-%d-5"), length: 45, delta: 0, hitFrame: true },
		{ frame: dir("toaster-overheat-%d-6"), length: 45, delta: 0 },
	],
	"toaster-attack-calm-mind": [
		{ frame: rot("toaster-walk-%d-0", 0), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 7), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 6), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 5), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 4), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 3), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 2), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 1), length: 30, delta: 0 },
		{ frame: rot("toaster-walk-%d-0", 0), length: 30, delta: 0 }
	],
	"toaster-warpout": [
		{ frame: rot("toaster-walk-%d-0", 0), length: 30, delta: -0.0 },
		{ frame: rot("toaster-walk-%d-0", 1), length: 30, delta: -0.4 },
		{ frame: rot("toaster-walk-%d-0", 2), length: 30, delta: -0.8 },
		{ frame: rot("toaster-walk-%d-0", 3), length: 30, delta: -1.2 },
		{ frame: rot("toaster-walk-%d-0", 4), length: 30, delta: -1.6 },
		{ frame: rot("toaster-walk-%d-0", 5), length: 30, delta: -2.0 },
		{ frame: rot("toaster-walk-%d-0", 6), length: 30, delta: -2.4 },
		{ frame: rot("toaster-walk-%d-0", 7), length: 30, delta: -2.8 },
		{ frame: rot("toaster-walk-%d-0", 0), length: 30, delta: -3.2 },
		{ frame: rot("toaster-walk-%d-0", 1), length: 30, delta: -3.6 },
		{ frame: rot("toaster-walk-%d-0", 2), length: 30, delta: -4.0 },
		{ frame: rot("toaster-walk-%d-0", 3), length: 30, delta: -4.4 },
		{ frame: rot("toaster-walk-%d-0", 4), length: 30, delta: -4.8 },
		{ frame: rot("toaster-walk-%d-0", 5), length: 30, delta: -5.2 },
		{ frame: rot("toaster-walk-%d-0", 6), length: 30, delta: -5.6 },
		{ frame: rot("toaster-walk-%d-0", 7), length: 30, delta: -6.0 }
	],
	"toaster-warpin": [
		{ frame: rot("toaster-walk-%d-0", 0), length: 30, delta: -6.0 },
		{ frame: rot("toaster-walk-%d-0", 1), length: 30, delta: -5.6 },
		{ frame: rot("toaster-walk-%d-0", 2), length: 30, delta: -5.2 },
		{ frame: rot("toaster-walk-%d-0", 3), length: 30, delta: -4.8 },
		{ frame: rot("toaster-walk-%d-0", 4), length: 30, delta: -4.4 },
		{ frame: rot("toaster-walk-%d-0", 5), length: 30, delta: -4.0 },
		{ frame: rot("toaster-walk-%d-0", 6), length: 30, delta: -3.6 },
		{ frame: rot("toaster-walk-%d-0", 7), length: 30, delta: -3.2 },
		{ frame: rot("toaster-walk-%d-0", 0), length: 30, delta: -2.8 },
		{ frame: rot("toaster-walk-%d-0", 1), length: 30, delta: -2.4 },
		{ frame: rot("toaster-walk-%d-0", 2), length: 30, delta: -2.0 },
		{ frame: rot("toaster-walk-%d-0", 3), length: 30, delta: -1.6 },
		{ frame: rot("toaster-walk-%d-0", 4), length: 30, delta: -1.2 },
		{ frame: rot("toaster-walk-%d-0", 5), length: 30, delta: -0.8 },
		{ frame: rot("toaster-walk-%d-0", 6), length: 30, delta: -0.4 },
		{ frame: rot("toaster-walk-%d-0", 7), length: 30, delta: -0.0 }
	],
	"blender-walk": [
		{ frame: dir("blender-base-%d"), length: 200, delta: 0 }
	],
	"blender-idle": [
		{ frame: dir("blender-base-%d"), length: 600, delta: 0 },
		{ frame: dir("blender-base-%d"), length: 100, delta: 0 },
		{ frame: dir("blender-base-%d"), length: 100, delta: 0 },
	],
	"blender-hurt": [
		{ frame: dir("blender-hurt-%d"), length: HURT_TIME, delta: -.2}
	],
	"blender-defeat": [
		{ frame: dir("blender-hurt-%d"), length: 150, delta: -.2 },
		{ frame: pas("empty"), length: 150, delta: -.2 },
		{ frame: dir("blender-hurt-%d"), length: 150, delta: -.2 },
		{ frame: pas("empty"), length: 150, delta: -.2 },
	],
	"blender-attack-tackle": [
		{ frame: dir("blender-base-%d"), length: 40, delta: .2 },
		{ frame: dir("blender-base-%d"), length: 40, delta: .4 },
		{ frame: dir("blender-base-%d"), length: 40, delta: .6, hitFrame: true },
		{ frame: dir("blender-base-%d"), length: 40, delta: .4 },
		{ frame: dir("blender-base-%d"), length: 40, delta: .2 },
		{ frame: dir("blender-base-%d"), length: 100, delta: 0 },
	],
	"blender-attack-blend": [
		{ frame: dir("blender-blend-a-%d"), length: 80, delta: 0 },
		{ frame: dir("blender-blend-b-%d"), length: 80, delta: 0 },
		{ frame: dir("blender-blend-c-%d"), length: 80, delta: 0 },
		{ frame: dir("blender-blend-d-%d"), length: 40, delta: 0 },
		{ frame: dir("blender-blend-e-%d"), length: 40, delta: 0 },
		{ frame: dir("blender-blend-f-%d"), length: 40, delta: 0 },
		{ frame: dir("blender-blend-g-%d"), length: 40, delta: 0 },
		{ frame: dir("blender-blend-h-%d"), length: 40, delta: 0 },
		{ frame: dir("blender-blend-i-%d"), length: 40, delta: 0, hitFrame: true },
		{ frame: dir("blender-blend-c-%d"), length: 80, delta: 0 },
		{ frame: dir("blender-blend-b-%d"), length: 80, delta: 0 },
		{ frame: dir("blender-blend-a-%d"), length: 80, delta: 0 },
	],
	"blender-attack-puree": [
		{ frame: dir("blender-puree-a-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-b-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-c-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-a-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-b-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-c-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-a-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-b-%d"), length: 50, delta: 0 },
		{ frame: dir("blender-puree-c-%d"), length: 50, delta: 0, hitFrame: true }
	],
	"spatula-walk": [
		{ frame: dir("spatula-base-%d"), length: 200, delta: 0 }
	],
	"spatula-idle": [
		{ frame: dir("spatula-base-%d"), length: 200, delta: 0 }
	],
	"spatula-hurt": [
		{ frame: dir("spatula-base-%d"), length: HURT_TIME, delta: -.2 }
	],
	"spatula-defeat": [
		{ frame: dir("spatula-hurt-%d"), length: 150, delta: -.2 },
		{ frame: pas("empty"), length: 150, delta: -.2 },
		{ frame: dir("spatula-hurt-%d"), length: 150, delta: -.2 },
		{ frame: pas("empty"), length: 150, delta: -.2 }
	],
	"spatula-attack-spatulate": [
		{ frame: dir("spatula-base-%d"), length: 40, delta: .2 },
		{ frame: dir("spatula-base-%d"), length: 40, delta: .4 },
		{ frame: dir("spatula-base-%d"), length: 40, delta: .6, hitFrame: true },
		{ frame: dir("spatula-base-%d"), length: 40, delta: .4 },
		{ frame: dir("spatula-base-%d"), length: 40, delta: .2 },
		{ frame: dir("spatula-base-%d"), length: 100, delta: 0 },
	]
}

frameData = [
	{ regex: /^toaster-walk-\d-\d$/, pivot: {x: 12, y: 20} },
	{ regex: /^toaster-hurt-\d$/, pivot: {x: 12, y: 20} },
	{ regex: /^toaster-spinshock-7$/, pivot: {x: 36, y: 27} },
	{ regex: /^toaster-spinshock-6$/, pivot: {x: 36, y: 44} },
	{ regex: /^toaster-spinshock-5$/, pivot: {x: 26, y: 44} },
	{ regex: /^toaster-spinshock-4$/, pivot: {x: 12, y: 44} },
	{ regex: /^toaster-spinshock-3$/, pivot: {x: 12, y: 35} },
	{ regex: /^toaster-spinshock-2$/, pivot: {x: 12, y: 20} },
	{ regex: /^toaster-spinshock-1$/, pivot: {x: 20, y: 20} },
	{ regex: /^toaster-spinshock-0$/, pivot: {x: 36, y: 20} },
	{ regex: /^toaster-overheat-\d-[0126]$/, pivot: {x: 12, y: 44} },
	{ regex: /^toaster-overheat-\d-[345]$/, pivot: {x: 24, y: 44} },
	{ regex: /^blender-blend-[defghi]-0*$/, pivot: {x: 12, y: 31} },
	{ regex: /^blender-blend-[defghi]-1*$/, pivot: {x: 12, y: 43} },
	{ regex: /^blender-blend-[defghi]-2*$/, pivot: {x: 12, y: 59} },
	{ regex: /^blender-blend-[defghi]-3*$/, pivot: {x: 36, y: 43} },
	{ regex: /^blender-blend-[defghi]-4*$/, pivot: {x: 36, y: 31} },
	{ regex: /^blender-blend-[defghi]-5*$/, pivot: {x: 36, y: 31} },
	{ regex: /^blender-blend-[defghi]-6*$/, pivot: {x: 12, y: 31} },
	{ regex: /^blender-blend-[defghi]-7*$/, pivot: {x: 12, y: 31} },
	{ regex: /^blender-.*$/, pivot: {x: 12, y: 31} },
	{ regex: /^spatula-.*$/, pivot: {x: 12, y: 21} },
]

function pas(s){
	return function(dir){
		return s;
	}
}

function dir(s){
	return function(dir){
		return sprintf(s, dir);
	}
}

function rot(s, r){
	return function(dir){
		return sprintf(s, (dir+r)%8);
	}
}

function getFrameDetails(fr){
	for(var i = 0; i < frameData.length; i++){
		if(frameData[i].regex.test(fr)){
			return frameData[i];
		}
	}

	return {
		regex: null,
		pivot: { x: 0, y: 0},
		delta: 0
	};
}