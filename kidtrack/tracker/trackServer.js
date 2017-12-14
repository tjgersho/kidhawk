var db = require('../server/util/db.js');

var moment = require("moment");

const net = require('net');


var clients = [];


function getTime(){
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    console.log('Get Time');
    console.log(hour + min + sec);

    return hour + min + sec;
}


function isValidClient(dataArray){

 console.log("Is Valid Client");
 console.log(dataArray);

 if(dataArray[0] === '*HQ'){

    return true;

	}else{
 
    return false;

  }
     
}







function logData(m){

//"*HQ,865205030993330,V1,025109,A,3935.4775,N,10504.9935,W,0.00,52,171017,FFFFFBFF#"

  var dataArray = m.split(",");
 console.log('MESSAGE FROM CLIENT');
 console.log(m);

 var imei = dataArray[1];

 if(dataArray[2]  === "V1"){
    var lat = dataArray[5];
    var latH = dataArray[6];
    var lon = dataArray[7];
    var lonH = dataArray[8];

  }else if(dataArray[2]  === "V4"){
    var lat = dataArray[7];
    var latH = dataArray[8];
    var lon = dataArray[9];
    var lonH = dataArray[10];
	

    db.device.find({where:{imei:imei}}).then(function(dev){
       
      console.log('Found Running Device to update that the command has been found.')
	console.log(dev.id);


       updateGpsDev(dev, {lastCmdConfirmed: true});


    },function(err){
        console.log('COuld not confirm the cmd timestamp!');
        console.log(err);
    });

  } else if(dataArray[2]  === "V3"){
	console.log('V3 DATA....');
	console.log("WHAT AM I SUPPOSED TO DO WITH THIS BS..");
	return;

  } else {

   return;
  }



 var latFloat = parseFloat(lat)/100;

 var latDeg = Math.floor(latFloat);

 var latHours = Math.floor((latFloat - latDeg)*100);
 var latMin = ((latFloat - latDeg)*100 - latHours);
 var latMinDeg = latMin/60;
 var latHourDeg = (latHours)/60;

 var latitude = latDeg + latHourDeg + latMinDeg;


 var lonFloat = parseFloat(lon)/100;

 var lonDeg = Math.floor(lonFloat);

 var lonHours = Math.floor((lonFloat - lonDeg)*100);

 var lonMin = ((lonFloat - lonDeg)*100 - lonHours);

 var lonMinDeg = lonMin/60;

 var lonHourDeg = (lonHours)/60;


 var longitude  = lonDeg + lonHourDeg + lonMinDeg;

 if(lonH === "W"){
   longitude = -longitude;
 }

 if(latH === "S"){
   latitude = -latitude;
 }

 console.log(latitude);
 console.log(longitude);

   db.device.find({where:{imei:imei}}).then(function(dev){
       

      db.gps.create({imei: imei, lat: latitude, lon: longitude}).then(function(gps){
         console.log('Created a gps data point!');
         console.log(gps.id);


	      console.log('Found Running Device to update that the command has been found.')
	  console.log(dev.id);


          gps.setDevice(dev);

	  //Update users data credtis..!!!!



       }, function(err){
          console.log('Oops there was an error creating the gps database entry');
       });




  },function(err){
     console.log('COuld not confirm the cmd timestamp!');
     console.log(err);
  });


}


function allowTimeForCmd(dev){

	console.log('Timestamp last cmd');
	console.log(dev.lastCmdTimeStamp);
	console.log('typeof' + typeof(dev.lastCmdTimeStamp));

	if(dev.lastCmdTimeStamp === null || dev.lastCmdTimeStamp === null){
		return false;
         } else {

          var now = moment();
          var lastConn =  moment( dev.lastCmdTimeStamp );

          console.log('Last Conn Diff');
          console.log(now.diff(lastConn, 'minutes'));

              if (now.diff(lastConn, 'minutes') > 1){
			return false;
	        }else{
                     return true;

              }
         }

}


function getRunningDevCmd(dev){


  var cmd = "doNothing";

	console.log('Last Cmd');
	console.log(dev.lastCmd);

  
	
  if(dev.watching){


      if(dev.lastCmdConfirmed && dev.lastCmd === "setToWatching"){

        cmd = "doNothing";


      }else if(dev.lastCmdConfirmed && dev.lastCmd !== "setToWatching" && dev.lastCmd === "checkSituation"){

	cmd = "setToWatching";

      }else if(dev.lastCmdConfirmed && dev.lastCmd !== "setToWatching" && dev.lastCmd !== "checkSituation"){

	cmd = "checkSituation";
   
     }else if(!dev.lastCmdConfirmed && allowTimeForCmd(dev) && dev.lastCmd === "setToWatching"){
	
	cmd = "doNothing";

      }else if(!dev.lastCmdConfirmed && !allowTimeForCmd(dev) && dev.lastCmd !== "setToWatching" || !dev.lastCmd){
	
	cmd = "setToWatching";

      }

       return cmd;


   }else{

    
      if(dev.lastCmdConfirmed && dev.lastCmd === "setToSleep"){
        cmd = "doNothing";
 

      }else if(dev.lastCmdConfirmed && dev.lastCmd === "resetDevice"){
        cmd = "setLanguage";

      }else if(dev.lastCmdConfirmed && dev.lastCmd === "setLanguage"){
        cmd = "doNothing";

      }else if(dev.lastCmdConfirmed && dev.lastCmd == "setToWatching"){

	cmd = "setToSleep";

      }else if(dev.lastCmdConfirmed && dev.lastCmd === "checkSituation"){

	cmd =  "setToSleep";

      }else if(!dev.lastCmdConfirmed && allowTimeForCmd(dev) && dev.lastCmd === "setToSleep"){
	
	cmd = "doNothing";

      }else if(!dev.lastCmdConfirmed && !allowTimeForCmd(dev) && dev.lastCmd !== "setToSleep"){
	
	cmd = "setToSleep";

      }

       return cmd;    
   }


}






function sendCmds(cmd, client){

    var getTimeString = getTime();
    var now = moment();


 switch (cmd){
  case "doNothing": ///DO NOTHING...

	console.log('CMDS>>>  Status Quo is good -- DOING NOTHING');

    return;
  break;
  case "checkSituation": // set time interval to 20 sec..

    client.write("*HQ,"+client.imei+",D1,"+getTimeString+",20,1#");
	
    console.log('-----------------CMD Sent: CHECK SITUAITION-----------------');
    console.log("*HQ,"+client.imei+",D1,"+getTimeString+",20,1#");

    db.device.find({where:{imei: client.imei}}).then(function(dev){
        console.log('found device to update the time cmd sent');
        console.log(dev.imei);
       updateGpsDev(dev,{interval: 20, lastCmdTimeStamp: now.format("YYYY-MM-DD HH:mm:ss"), lastCmdConfirmed: false, lastCmd: "checkSituation"});

    },function(err){
        console.log('Couldnt find dev to update time cmd');
        console.log(err);

    });
  break;
  case "setToWatching": // set time interval to 20 sec..

    client.write("*HQ,"+client.imei+",D1,"+getTimeString+",20,1#");
	
    console.log('-----------------CMD Sent: SET TO WATCHING-----------------');
    console.log("*HQ,"+client.imei+",D1,"+getTimeString+",20#");

    db.device.find({where:{imei: client.imei}}).then(function(dev){
        console.log('found device to update the time cmd sent');
        console.log(dev.imei);
       updateGpsDev(dev,{interval: 20, lastCmdTimeStamp: now.format("YYYY-MM-DD HH:mm:ss"), lastCmdConfirmed: false, lastCmd: "setToWatching"});

    },function(err){
        console.log('Couldnt find dev to update time cmd');
        console.log(err);

    });
  break;
  case "resetDevice": // Reset the device..


    client.write("*HQ,"+client.imei+",R1,"+getTimeString+"#");
    console.log('-----------------CMD Sent: RESET DEVICE-----------------');
    console.log("*HQ,"+client.imei+",R1,"+getTimeString+"#");

    db.device.find({where:{imei: client.imei}}).then(function(dev){
        console.log('found device to update the time cmd sent');
        console.log(dev.imei);
       updateGpsDev(dev, {interval: 10, lastCmdTimeStamp: now.format("YYYY-MM-DD HH:mm:ss"), lastCmdConfirmed: false,  lastCmd: "resetDevice"});
       removeClient(client);
    },function(err){
        console.log('Couldnt find dev to update time cmd');
        console.log(err);

    });

  break;
  case "initializeDevice": // Reset the device..


    client.write("*HQ,11111111111,R1,"+getTimeString+"#");
    console.log('-----------------CMD Sent: INITIALIZE DEVICE-----------------');
    console.log("*HQ,11111111111,R1,"+getTimeString+"#");
    removeClient(client);

  break;
  case "setLanguage": // Reset the device..


    client.write("*HQ,"+client.imei+",LAG,"+getTimeString+"2#");

    console.log('-----------------CMD Sent: SET LANGUAGE -----------------');
    console.log("*HQ,"+client.imei+",LAG,"+getTimeString+"2#");

    db.device.find({where:{imei: client.imei}}).then(function(dev){
        console.log('found device to update the time cmd sent');
        console.log(dev.imei);

       updateGpsDev(dev, {interval: 200, lastCmdTimeStamp: now.format("YYYY-MM-DD HH:mm:ss"), lastCmdConfirmed: false,  lastCmd: "setLanguage"});
      
    },function(err){
        console.log('Couldnt find dev to update time cmd');
        console.log(err);

    });

  break;
  case "setToSleep":  // Put device to sleep..

    
    client.write("*HQ,"+client.imei+",D1,"+getTimeString+",1000#");

    console.log('-----------------CMD Sent: SET TO SLEEP -----------------');
    console.log("*HQ,"+client.imei+",D1,"+getTimeString+",1000#");

        db.device.find({where:{imei: client.imei}}).then(function(dev){
        console.log('found device to update the time cmd sent');
        console.log(dev.imei);
        updateGpsDev(dev,{interval: 1000, lastCmdTimeStamp: now.format("YYYY-MM-DD HH:mm:ss"), lastCmdConfirmed: false, lastCmd: "setToSleep"});

    },function(err){
        console.log('Couldnt find dev to update time cmd');
        console.log(err);
        
    });

  break;
  case "shutDownDevice":  // Put device to sleep..

    
    client.write("*HQ,"+client.imei+",D1,"+getTimeString+",5000#");
    console.log('-----------------CMD Sent: SHUT DOWN DEVICE -----------------');
    console.log("*HQ,"+client.imei+",D1,"+getTimeString+",5000#");


        db.device.find({where:{imei: client.imei}}).then(function(dev){
        console.log('found device to update the time cmd sent');
        console.log(dev.imei);
        updateGpsDev(dev,{interval: 5000, lastCmdTimeStamp: now.format("YYYY-MM-DD HH:mm:ss"), lastCmdConfirmed: false, lastCmd: "shutDownDevice"});

    },function(err){
        console.log('Couldnt find dev to update time cmd');
        console.log(err);
        
    });

  break;
 }

}





function makeid() {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 32; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}





const server = net.createServer((socc) => {
  // 'connection' listener
  console.log('client connected');
  //console.log(socc);
   socc.id = makeid();
   socc.errors = {};
	
  clients.push(socc);

  var clientAddr = socc.remoteAddress + ":" + socc.remotePort;

	console.log(socc.id);

  // sendCmds("initializeDevice", socc);

  socc.on('data', (data) => {

     console.log('Data');
     console.log(data.toString());
      var message = data.toString();
  
     var dataArray = message.split(",");
	   console.log(dataArray);


     if(isValidClient(dataArray)){

        var imei = dataArray[1];

	
	      if(socc.imei === undefined){
  		     socc.imei = imei;

         }else if(socc.imei !== imei){

   		     socc.imei = imei;
         }

        var status = dataArray[dataArray.length-1].slice(0,-1);
	      console.log("DEVICE STATUS");
	       console.log(status);
        	console.log(status[3]);

      getGpsDev(imei).then(function(dev){
        console.log(dev);
       if(!!dev){ 
        console.log('DEV in find dev in the data tcp callback..');
        console.log(dev.id);
        console.log(dev.ktc);
        console.log(dev.user);
        console.log('The imei associated.')
        console.log(dev.imei);
        console.log(imei);

    

	       if(status[3] === "B"){
  	          updateGpsDev(dev, {alarm: true});
	        }

	
	      if(status[3] === "E"){
		
	         if(!socc.errors.v3Eerror){
 		         socc.errors.v3Eerror = true;
	     	    socc.errors.v3EerrorTime = moment().format("YYYY-MM-DD HH:mm:ss");
	         }

	            var now = moment();
               var lastConn =  moment( socc.errors.v3EerrorTime );

               console.log('Last Conn Diff');
               console.log(now.diff(lastConn, 'minutes'));

              if (now.diff(lastConn, 'minutes') > 30){
                  sendCmds("resetDevice", socc);
		          }
	
		

		      if (now.diff(lastConn, 'minutes') > 5 && dev.watching){
                  sendCmds("resetDevice", socc);
		      }
		
           }else{
               socc.errors.v3Eerror = false;
	        }
   

	//Check if the user has credits to log this data.. otherwise .. send cmd to shut down device..

	

		console.log('Device to check if user has credits');

		if(dev.user !==  undefined && dev.user !== null){
      socc.errors.noUser = false;
		   console.log(dev.user.pingCredits);

		  if(dev.user.pingCredits > 0) {
              socc.errors.noPingCredits = false;
		      	  dev.user.update({pingCredits: dev.user.pingCredits-1});

		          logData(message);
		
		  }else{
           if(!socc.errors.noPingCredits){
			       console.log('SHUT DOWN!');
			       sendCmds("shutDownDevice", socc);
		         dev.update({watching: false});
             dev.user.update({pingCredits: dev.user.pingCredits-1});
             socc.errors.noPingCredits = true;
          }
		  }
		}else{

          if(!socc.errors.noUser){
           console.log('NO USER -- SHIT SHUT DOWN!');
			      sendCmds("setToSleep", socc);
             socc.errors.noUser = true;
          }
		}
   }else{

      console.log('Device is not in database.. or was not found.');
      socc.write('You are not allowed');
      removeClient(socc);
      socc.end();
   }
             
	 },function(err){
		console.log('Couldnt get Device with IEMI for to do work..');
		console.log(err);
	});
  

     }else{
      socc.write('You are not allowed');
      removeClient(socc);
      socc.end();
     }

  });
   

   socc.on('end', () => {
    console.log('client disconnected');
	console.log(clients.length);

        removeClient(socc);

	console.log(clients.length);
        socc.end();
  });
 

 
  socc.pipe(socc);
});


server.on('error', (err) => {
  console.log('ERROR');
  console.log(err);
 
   throw err;
  
});

server.listen(8083, () => {
  console.log('server bound');
});









function removeClient(soc){
  console.log('In Remove Clients');
	console.log(soc.id);
	
     for(var i=0; i<clients.length; i++){
		if(clients[i].id === soc.id){
			clients.splice(i,1);
               }

	}
}






function getGpsDev(imei){

  return new Promise(function(resolve, reject){
	db.device.find({where: {imei: imei}, include:[{model: db.user}]}).then(function(dev){
		console.log("Found Device in DB");
		resolve(dev);
        },function(err){
		       reject(err);
        });
  });

}




function  updateGpsDev(dev, updateObj){
	  console.log('Update Object');
		dev.update(updateObj).then(function(devup){
			console.log('Dev Update success');
			console.log(devup.imei);
                  },function(err){
			console.log('Dev Update err');
			console.log(err);
                  });
 
}


function runCmds(client){
	console.log('Client in runCmds');
	console.log(client.id);
	console.log(client.imei);

	getGpsDev(client.imei).then(function(dev){

   if(!dev){
    if(dev.user !==  undefined && dev.user !== null && dev.userId !== null){
	    console.log('Device in runCmds');
	     console.log(dev.id);
	     console.log('Dev user ping Credits');
	     console.log(dev.user.pingCredits);

	    if(dev.user.pingCredits > 0) {


            var command = getRunningDevCmd(dev);

		     console.log('Next Command');
		     console.log(command);
	
		     sendCmds(command, client);

	      }

       }

     }


        },function(err){
		console.log('Could not get GPS Device');
		console.log(err);

	});
}


function monitorClients(){

console.log('MONITOR CLIENTS');
console.log(clients.length);

  for(var i=0; i<clients.length; i++){

	console.log('--------------------------------Client-----------------------------');
	console.log(clients[i].id);

	if(clients[i].imei !== undefined){
	   console.log(clients[i].imei);
   
           runCmds(clients[i]);

 	}

 
  }
}


setInterval(function(){ monitorClients(); }, 5000);







