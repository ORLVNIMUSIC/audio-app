function ExecuteScript()
{
	let audioContext;
	try {
	  audioContext =
		new (window.AudioContext || window.webkitAudioContext)();
	} catch (error) {
	  window.alert(
		`Извините, но ваш браузер не поддерживает Web Audio API!`
	  );
	}
	if (audioContext !== undefined) {
		
		function drawOsci() {
			drawVisual = requestAnimationFrame(drawOsci);
			analyserOsci.getByteTimeDomainData(dataArrayOsci);
			canvasOsciCtx.fillStyle = 'rgb(255, 255, 255)';
			canvasOsciCtx.fillRect(0, 0, canvasOsci.width, canvasOsci.height);	
			canvasOsciCtx.lineWidth = 2;
			canvasOsciCtx.strokeStyle = 'rgb(200, 50, 50)';

			canvasOsciCtx.beginPath();
			var sliceWidth = canvasOsci.width * 1.0 / bufferLengthOsci;
			var x = 0;
			for(var i = 0; i < bufferLengthOsci; i++) {
				var v = dataArrayOsci[i] / 128.0;
				var y = v * canvasOsci.height/2;

				if(i === 0) {
					canvasOsciCtx.moveTo(x, y);
				} else {
					canvasOsciCtx.lineTo(x, y);
				}

				x += sliceWidth;
			}
			canvasOsciCtx.lineTo(canvasOsci.width, canvasOsci.height/2); //тут делили на два высоту
			canvasOsciCtx.stroke();
		};	
		
		function drawSpec() {
			drawVisual = requestAnimationFrame(drawSpec);
			analyserSpec.getByteFrequencyData(dataArraySpec);
			canvasSpecCtx.fillStyle = 'rgb(255, 255, 255)';
			canvasSpecCtx.fillRect(0, 0, canvasSpec.width, canvasSpec.height);	
			var barWidth = (canvasSpec.width / bufferLengthSpec)*3;	// тут вот надо сделать логарифм (было: var barWidth = (canvasSpec.width / bufferLengthSpec)*2.5;
			var barHeight;
			var x=0;
			var scale = Math.log(bufferLengthSpec - 1) / canvasSpec.width;
			
			canvasSpecCtx.beginPath();
			canvasSpecCtx.moveTo(x+barWidth,canvasSpec.height-dataArraySpec[0]);
			
			for (var i=0; i<bufferLengthSpec; i++)
			{
				barHeight = dataArraySpec[i]*2;
				canvasSpecCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
				canvasSpecCtx.fillRect(x,canvasSpec.height-barHeight/2,barWidth,barHeight);
				canvasSpecCtx.lineTo(x,canvasSpec.height-barHeight/2);
				// canvasSpecCtx.moveTo(x+barWidth,canvasSpec.height-dataArraySpec[0]);
				// x += barWidth + 1;
				x = Math.log(i) / scale;
			}
			canvasSpecCtx.stroke();
		};	
		
		var audio = document.querySelector('#APlay'),
			volume = document.querySelector('#AVol'),
			pitch = document.querySelector('#APitch'),
			fullRec = document.querySelector('#AFullTrack'),
			oscilog = document.querySelector('#AOsci'),
			DownlBut = document.querySelector('#ADownl'),
			StopRecBut = document.querySelector('#AStopRec'),
			StartRecBut = document.querySelector('#AStartRec'),
			spectra = document.querySelector('#ASpec'),
			canvasOsci = document.querySelector('#canvasOsci'),
			canvasSpec = document.querySelector('#canvasSpec'),
			files = document.querySelector('#AFile');
		var canvasOsciCtx = canvasOsci.getContext("2d");
		var canvasSpecCtx = canvasSpec.getContext("2d");
			
		
		var context = new (window.AudioContext || window.webkitAudioContext);
		
		var dest = context.createMediaStreamDestination();
		
		var mediaRecorder = new MediaRecorder(dest.stream);
		
		var gain = context.createGain();
		Tone.context = context;
		var pitchShift = new Tone.PitchShift();
		gain.gain.value = 1;
		var Track, bufferLengthOsci, bufferLengthSpec, analyserOsci, analyserSpec, 
		dataArrayOsci, dataArraySpec;
		var now = context.currentTime;
		analyserOsci = context.createAnalyser();
		analyserSpec = context.createAnalyser();
		var analyserOsciCheck=false;
		var analyserSpecCheck=false;
		var chunks = [];
		var file;
		var recCheck=false;
		
		pitch.addEventListener('input', function(){
			Tone.disconnect(Track, pitchShift);
			Tone.disconnect(pitchShift, gain);
			pitchShift = new Tone.PitchShift();
			Tone.connect(Track, pitchShift);
			Tone.connect(pitchShift, gain);
			pitchShift.pitch=pitch.value;
			document.querySelector("#APitchVis").textContent=pitch.value;
		});

		pitch.addEventListener('dblclick',function(){
			pitch.value=0;
			document.querySelector('#APitchVis').textContent=pitch.value;
			Tone.disconnect(Track, pitchShift);
			Tone.disconnect(pitchShift, gain);
			pitchShift = new Tone.PitchShift();
			Tone.connect(Track, pitchShift);
			Tone.connect(pitchShift, gain);
			pitchShift.pitch=pitch.value;
		});

		files.addEventListener('change', function(){
			audio.src = URL.createObjectURL(this.files[0]); 
		});
		
		StopRecBut.addEventListener('click', function(){
			if (recCheck){
				audio.pause();
				fullRec.disabled=false;
				fullRec.value="Записать трек целиком";
				audio.controls=true;
				recCheck=false;
				files.disabled=false;
			}
			mediaRecorder.stop();
			StopRecBut.hidden=true;
			StartRecBut.hidden=false;
		});
		
		StartRecBut.addEventListener('click', function(){
			mediaRecorder.start();
			StopRecBut.hidden=false;
			StartRecBut.hidden=true;
		});

		fullRec.addEventListener('click', function(){
			recCheck=true;
			audio.currentTime = 0;
			audio.play();
			fullRec.value="Идет записть трека целиком";
			fullRec.disabled=true;
			mediaRecorder.start();
			StopRecBut.hidden=false;
			StartRecBut.hidden=true;
			audio.controls=false;
			files.disabled=true;
		});
		audio.addEventListener('ended', function(){
			if(recCheck){
				fullRec.disabled=false;
				fullRec.value="Записать трек целиком";
				mediaRecorder.stop();
				StopRecBut.hidden=true;
				StartRecBut.hidden=false;
				audio.controls=true;
				recCheck=false;
				files.disabled=false;
			}
		});
		
		DownlBut.addEventListener('click', function(){
			ForceDownload(URL.createObjectURL(file), file.name);
		});
		
		mediaRecorder.ondataavailable = function(evt) {
			chunks.push(evt.data);
		};

		mediaRecorder.onstop = function(evt) {
			file = new File(chunks, "recorded", {'type' : 'audio/webm'} );
			chunks = [];
			document.querySelector("#ANew").src = URL.createObjectURL(file);
			DownlBut.hidden=false;
		};
		
		
		audio.addEventListener('canplaythrough', function(){
			context.resume();
			try{
				Track = context.createMediaElementSource(this);
				Tone.connect(Track, pitchShift);
				Tone.connect(pitchShift, gain);
				gain.connect(dest);
				gain.connect(context.destination);
				StartRecBut.hidden=false;
				spectra.hidden=false;
				oscilog.hidden=false;
				pitch.disabled=false;
				volume.disabled=false;
				fullRec.hidden=false;
			}
			catch{}
		});
		
		audio.addEventListener('timeupdate', function(){
			if(!isNaN(audio.currentTime)) {
				audio.playbackRate = 1;
			}
		});
		
		volume.addEventListener('input',function(){
			document.querySelector('#AVolVis').textContent=volume.value;
			gain.gain.value=volume.value;
		});
		
		volume.addEventListener('dblclick',function(){
			volume.value=1;
			document.querySelector('#AVolVis').textContent=volume.value;
			gain.gain.value=volume.value;
		});
		
		oscilog.addEventListener('click',function(){
			if (!analyserOsciCheck)
			{
				gain.connect(analyserOsci);
				analyserOsci.fftSize = 1024*8;  //32kb максимальное значение для анализатора
				analyserOsci.maxDecibels=0;
				analyserOsci.minDecibels=-200;
				bufferLengthOsci = analyserOsci.frequencyBinCount;
				dataArrayOsci = new Uint8Array(bufferLengthOsci);
				
				canvasOsciCtx.clearRect(0, 0, canvasOsci.width, canvasOsci.height);	
				drawOsci();
				analyserOsciCheck=true;
				oscilog.value="Выключить";
			}
			else
			{
				gain.disconnect(analyserOsci);
				analyserOsciCheck=false;
				oscilog.value="Посмотреть";
			}
		});
		
		spectra.addEventListener('click',function(){
			if (!analyserSpecCheck)
			{
				gain.connect(analyserSpec);
				analyserSpec.fftSize = 1024*4;  //32kb максимальное значение для анализатора
				analyserSpec.maxDecibels=-20;
				bufferLengthSpec = analyserSpec.frequencyBinCount;
				dataArraySpec = new Uint8Array(bufferLengthSpec);
				
				canvasSpecCtx.clearRect(0, 0, canvasSpec.width, canvasSpec.height);	
				drawSpec();
				analyserSpecCheck=true;
				spectra.value="Выключить";
			}
			else
			{
				gain.disconnect(analyserSpec);
				analyserSpecCheck=false;
				spectra.value="Посмотреть";
			}
		});
		function ForceDownload(href, downlname) {
			var anchor = document.createElement('a');
			anchor.href = href;
			anchor.download = downlname;
			document.body.appendChild(anchor);
			anchor.click();
		}
	}
};