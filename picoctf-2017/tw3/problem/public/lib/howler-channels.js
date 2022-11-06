// howler-channels.js
// Adds channels to Howler.js
// Created by bluepichu

(function(){
	if(Howler === undefined){
		throw Error("You need to import Howler.js first.");
		return;
	}

	var Channel = function(){
		this._sounds = [];
		this._muted = false;
		this._volume = 1;
	}

	Channel.prototype = {
		addSound: function(snd, spr){
			var self = this;

			var cb = function(id){
				self._sounds.push({ howl: snd, id: id });

				snd.volume(self._volume, id);

				if(self._muted){
					snd.mute(id);
				} else {
					snd.unmute(id);
				}
			};

			if(spr === undefined){
				snd.play(cb);
			} else {
				snd.play(spr, cb);
			}
		},

		empty: function(){
			var self = this;

			self._sounds.forEach(function(snd){
				snd.howl.stop(snd.id);
			});

			self._sounds = [];
		},

		mute: function(){
			var self = this;

			self._sounds.forEach(function(snd){
				snd.howl.mute(snd.id);
			});

			self._muted = true;
		},

		unmute: function(){
			var self = this;

			self._sounds.forEach(function(snd){
				snd.howl.unmute(snd.id);
			});

			self._muted = false;
		},

		volume: function(vol){
			var self = this;

			self._sounds.forEach(function(snd){
				snd.howl.volume(self._muted ? 0 : vol, snd.id);
			});

			self._volume = vol;
		},

		fade: function(start, end, duration){
			var self = this;

			self._sounds.forEach(function(snd){
				snd.howl.fade(self._muted ? 0 : start, self._muted ? 0 : end, duration, snd.id);
			});

			// something with self._volume here?
		}
	}

	if(typeof window !== "undefined"){
		window.HowlerChannel = Channel;
	}
})();