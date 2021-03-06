var myApp = angular.module('helloworld', ['ui.router']);

myApp.controller('chatCtrl', ['$http','$scope',function($http,$scope) {

    // get data from flask
    $scope.socket = null;
    $scope.hasData = 0;
    $scope.proccess = 0;
    $scope.transcript = [];

    $scope.record = function($event){
      $event.preventDefault();
      if($scope.socket == null){
        $scope.socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
        $scope.socket.on('connect', function() {
            navigator.getUserMedia({audio: true}, initializeRecorder, function(a, b, c){
              console.log(a, b, c);
            });
        });

        $scope.socket.on('my_response', function (msg) {
            console.log(msg);            
        		$scope.$apply(function() {
              $scope.proccess = 0;
        			$scope.transcript = [msg.query, msg.answer];
              $scope.hasData = 1;
        		});
            var audioPlay = new Audio(msg.data);
            audioPlay.play();
        });
      }
      else {
        $scope.socket.disconnect();
        $scope.socket.connect();
      }
      $event.currentTarget.querySelector("button").disabled = true;
    }

    $scope.stopRecord = function($event){
      $event.preventDefault();
      $scope.proccess = 1;
        console.log("Proccesing data...");
       mediaStream.getAudioTracks()[0].stop();
          audio_context.close();
          $scope.socket.emit('disconnect_request');
      $event.currentTarget.querySelector("button").disabled = false;

    }


	 // audio functions
	function initializeRecorder(stream){
	   mediaStream = stream;

	   // get sample rate
	   audio_context = new AudioContext;
	   sampleRate = audio_context.sampleRate;
	   console.log('<sample_rate>', sampleRate);
	   $scope.socket.emit('sample_rate', sampleRate);

	   var audioInput = audio_context.createMediaStreamSource(stream);

	   console.log("Created media stream.");

	   var bufferSize = 4096;
	   // record only 1 channel
	   var recorder = audio_context.createScriptProcessor(bufferSize, 1, 1);
	   // specify the processing function
	   recorder.onaudioprocess = recorderProcess;
	   // connect stream to our recorder
	   audioInput.connect(recorder);
	   // connect our recorder to the previous destination
	   recorder.connect(audio_context.destination);          
	}
	function recorderProcess(e) {
	  var left = e.inputBuffer.getChannelData(0);
	  $scope.socket.emit('audio', left);
	}
	function convertFloat32ToInt16(buffer) {
	  l = buffer.length;
	  buf = new Int16Array(l);
	  while (l--) {
	    buf[l] = Math.min(1, buffer[l])*0x7FFF;
	  }
	  console.log(buf);
	  return buf.buffer;
	}
}]);

myApp.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/home");
  var homeState = {
    name: 'home',
    url: '/home',
    templateUrl: './views/home.html'
  }
  
  var resumeState = {
    name: 'resume',
    url: '/resume',
    templateUrl: './views/resume.html'
  }
  
  var chatState = {
    name: 'chat',
    url: '/chat',
    templateUrl: './views/chat.html'
  }

  $stateProvider
    .state(homeState)
    .state(resumeState)
    .state(chatState);
});
