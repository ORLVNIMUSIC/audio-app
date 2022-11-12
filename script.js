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
			canvasOsciCtx.fillStyle = 'rgb(100, 100, 100)';
			canvasOsciCtx.fillRect(0, 0, canvasOsci.getBoundingClientRect().width, canvasOsci.getBoundingClientRect().height);	
			canvasOsciCtx.lineWidth = 2;
			canvasOsciCtx.strokeStyle = 'rgb(255, 255, 255)';

			canvasOsciCtx.beginPath();
			var sliceWidth = canvasOsci.getBoundingClientRect().width * 1.0 / bufferLengthOsci;
			var x = 0;
			for(var i = 0; i < bufferLengthOsci; i++) {
				var v = dataArrayOsci[i] / 128.0;
				var y = v * canvasOsci.getBoundingClientRect().height/2;

				if(i === 0) {
					canvasOsciCtx.moveTo(x, y);
				} else {
					canvasOsciCtx.lineTo(x, y);
				}

				x += sliceWidth;
			}
			canvasOsciCtx.lineTo(canvasOsci.getBoundingClientRect().width, canvasOsci.getBoundingClientRect().height/2); //тут делили на два высоту
			canvasOsciCtx.stroke();
		};	
		
		function drawSpec() {
			drawVisual = requestAnimationFrame(drawSpec);
			analyserSpec.getByteFrequencyData(dataArraySpec);
			canvasSpecCtx.fillStyle = 'rgb(100, 100, 100)';
			var canvasWidth = canvasSpec.getBoundingClientRect().width;
			var canvasHeight = canvasSpec.getBoundingClientRect().height;

			console.log(canvasWidth,canvasHeight)
			canvasSpecCtx.fillRect(0, 0, canvasWidth, canvasHeight);	
			var barWidth = (canvasWidth / bufferLengthSpec);	// тут вот надо сделать логарифм (было: var barWidth = (canvasSpec.width / bufferLengthSpec)*2.5;
			var barHeight;
			var x=0;
			var scale = canvasWidth / bufferLengthSpec;
			
			canvasSpecCtx.beginPath();
			canvasSpecCtx.moveTo(x+barWidth,canvasHeight-dataArraySpec[0]);
			
			for (var i=0; i < bufferLengthSpec; i++)
			{
				barHeight = dataArraySpec[i]*1.7;
				canvasSpecCtx.fillStyle = 'rgb(' + (barHeight+100) + ',255,255)';
				canvasSpecCtx.fillRect(x,canvasHeight-barHeight/2,barWidth,barHeight);
				canvasSpecCtx.lineTo(x,canvasHeight-barHeight/2);
				// canvasSpecCtx.moveTo(x+barWidth,canvasSpec.height-dataArraySpec[0]);
				// x += barWidth + 1;
				if (i % 200 === 0) console.log(x)
				x += scale * i;
			}
			canvasSpecCtx.stroke();
		};	
		
		var audio = document.querySelector('#APlay'),
			volume = document.querySelector('#AVol'),
			panner = document.querySelector('#APan'),
			pitch = document.querySelector('#APitch'),
			EQ = document.querySelector('#AEQ'),
			delay = document.querySelector('#ADelay'),
			delayGainRange = document.querySelector('#ADelayGain'),
			delayBut = document.querySelector('#ADelayBut'),
			EQgain = document.querySelector('#EQgain'),
			CompTres = document.querySelector('#ACompTres'),
			fullRec = document.querySelector('#AFullTrack'),
			oscilog = document.querySelector('#AOsci'),
			DownlBut = document.querySelector('#ADownl'),
			StopRecBut = document.querySelector('#AStopRec'),
			StartRecBut = document.querySelector('#AStartRec'),
			spectra = document.querySelector('#ASpec'),
			canvasOsci = document.querySelector('#canvasOsci'),
			canvasSpec = document.querySelector('#canvasSpec'),
			files = document.querySelector('#AFile');
		var radEQ=document.getElementsByName('EQ');

		var canvasOsciCtx = canvasOsci.getContext("2d");
		var canvasSpecCtx = canvasSpec.getContext("2d");
			
		var context = new (window.AudioContext || window.webkitAudioContext);
		Tone.context = context;
		var aFilter = context.createBiquadFilter();
		var dest = context.createMediaStreamDestination();
		var compressor = context.createDynamicsCompressor();
		var gain = context.createGain();
		var pitchShift = new Tone.PitchShift();
		var delayNode = context.createDelay(4);
		var delayGain = context.createGain();
		var panNode = context.createStereoPanner();
		
		var mediaRecorder = new MediaRecorder(dest.stream);
		
		var Track, bufferLengthOsci, bufferLengthSpec, analyserOsci, analyserSpec, 
		dataArrayOsci, dataArraySpec;
		analyserOsci = context.createAnalyser();
		analyserSpec = context.createAnalyser();

		var analyserOsciCheck=false;
		var analyserSpecCheck=false;
		var delayCheck=false;
		var recCheck=false;

		var chunks = [];
		var file;
		var button;
		
		panner.addEventListener('input',function(){
			document.querySelector('#APanVis').textContent=panner.value;
			panNode.pan.value=panner.value;
		});
		
		panner.addEventListener('dblclick',function(){
			panner.value=0;
			document.querySelector('#APanVis').textContent=panner.value;
			panNode.pan.value=panner.value;
		});

		pitch.addEventListener('input', function(){
			Tone.disconnect(Track, pitchShift);
			Tone.disconnect(pitchShift, aFilter);
			pitchShift = new Tone.PitchShift();
			Tone.connect(Track, pitchShift);
			Tone.connect(pitchShift, aFilter);
			pitchShift.pitch=pitch.value;
			document.querySelector("#APitchVis").textContent=pitch.value;
		});

		pitch.addEventListener('dblclick',function(){
			pitch.value=0;
			document.querySelector('#APitchVis').textContent=pitch.value;
			Tone.disconnect(Track, pitchShift);
			Tone.disconnect(pitchShift, aFilter);
			pitchShift = new Tone.PitchShift();
			Tone.connect(Track, pitchShift);
			Tone.connect(pitchShift, aFilter);
			pitchShift.pitch=pitch.value;
		});

		delay.addEventListener('input', function(){
			delayNode.delayTime.value=delay.value;
			document.querySelector('#ADelayVis').textContent=delay.value + ' s';
		});
		
		delay.addEventListener('dblclick',function(){
			delay.value=1;
			delayNode.delayTime.value=delay.value;
			document.querySelector('#ADelayVis').textContent=delay.value + ' s';
		});

		delayBut.addEventListener('click', function(){
			if (!delayCheck){
				delayBut.value='Выключить дилэй';
				delay.disabled=false;
				delayGainRange.disabled=false;
				compressor.connect(delayNode);
				delayNode.connect(delayGain);
				delayGain.connect(panNode);
				delayCheck=true;
			}
			else{
				delayBut.value='Включить дилэй';
				delay.disabled=true;
				delayGainRange.disabled=true;
				compressor.disconnect(delayNode);
				delayNode.disconnect(delayGain);
				delayGain.disconnect(panNode);
				delayCheck=false;
			}
		});

		delayGainRange.addEventListener('input', function(){
			delayGain.gain.value=delayGainRange.value;
			document.querySelector('#ADelayGainVis').textContent=delayGainRange.value;
		});
		
		delayGainRange.addEventListener('dblclick',function(){
			delayGainRange.value=0;
			delayGain.gain.value=delayGainRange.value;
			document.querySelector('#ADelayGainVis').textContent=delayGainRange.value;
		});

		EQ.addEventListener('input', function(){
			aFilter.frequency.value=EQ.value;
			document.querySelector('#AEQVis').textContent=EQ.value + ' Hz';
		});
		
		EQ.addEventListener('dblclick',function(){
			EQ.value=1000;
			aFilter.frequency.value=EQ.value;
			document.querySelector('#AEQVis').textContent=EQ.value + ' Hz';
		});

		CompTres.addEventListener('input', function(){
			compressor.threshold.value=CompTres.value;
			document.querySelector('#ACompTresVis').textContent=CompTres.value + ' db';
		});
		
		CompTres.addEventListener('dblclick',function(){
			CompTres.value=0;
			compressor.threshold.value=CompTres.value;
			document.querySelector('#ACompTresVis').textContent=CompTres.value + ' db';
		});

		EQgain.addEventListener('input', function(){
			aFilter.gain.value=EQgain.value;
			document.querySelector('#AEQgainVis').textContent=EQgain.value + ' db';
		});
		
		EQgain.addEventListener('dblclick',function(){
			EQgain.value=0;
			aFilter.gain.value=EQgain.value;
			document.querySelector('#AEQgainVis').textContent=EQgain.value + ' db';
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
			fullRec.value="Идет запись трека целиком";
			fullRec.disabled=true;
			mediaRecorder.start();
			StopRecBut.hidden=false;
			StartRecBut.hidden=true;
			audio.controls=false;
			files.disabled=true;
		});

		audio.addEventListener('pause', function(){
			if (!recCheck){
				if (delayCheck){
					delayGain.gain.value=0;
					delayGainRange.value=0;
					document.querySelector('#ADelayGainVis').textContent=delayGainRange.value;
				}
			}
		});

		audio.addEventListener('ended', function(){
			if (delayCheck){
				delayGain.gain.value=0;
				delayGainRange.value=0;
				document.querySelector('#ADelayGainVis').textContent=delayGainRange.value;
			}
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
		
		for (i = 0; i < radEQ.length; i++) {
			button = radEQ[i];

			button.addEventListener('change', function(){
				if(radEQ[0].checked){
					aFilter.type='lowpass';
				}
				if(radEQ[1].checked){
					aFilter.type='highpass';
				}
				if(radEQ[2].checked){
					aFilter.type='peaking';
				}
			});
		}
		
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

		files.addEventListener('change', function(){
			audio.src = URL.createObjectURL(this.files[0]);
		});

		audio.addEventListener('canplaythrough', function(){
			context.resume();
			try{
				Track = context.createMediaElementSource(this);
				Tone.connect(Track, pitchShift);
				Tone.connect(pitchShift, aFilter);
				aFilter.connect(compressor);
				compressor.connect(panNode);
				panNode.connect(gain);
				gain.connect(dest);
				gain.connect(context.destination);

				if(radEQ[0].checked){
					aFilter.type='lowpass';
				}
				if(radEQ[1].checked){
					aFilter.type='highpass';
				}
				if(radEQ[2].checked){
					aFilter.type='peaking';
				}

				delayNode.delayTime.value=1;

				delayGain.gain.value=0;
				
				gain.gain.value = 1;

				compressor.threshold.value = 0;

				aFilter.Q.value = 5;

				StartRecBut.hidden=false;
				spectra.hidden=false;
				oscilog.hidden=false;
				pitch.disabled=false;
				volume.disabled=false;
				fullRec.hidden=false;
				EQ.disabled=false;
				EQgain.disabled=false;
				CompTres.disabled=false;
				delayBut.disabled=false;
				panner.disabled=false;
			}
			catch{}
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
				
				canvasOsciCtx.clearRect(0, 0, canvasOsci.getBoundingClientRect().width, canvasOsci.getBoundingClientRect().height);	
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
				
				canvasSpecCtx.clearRect(0, 0, canvasSpec.getBoundingClientRect().width, canvasSpec.getBoundingClientRect().height);	
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