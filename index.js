var mqtt    = require('mqtt');
var count =0;
var gamestate = 0;
var globaltime = Math. floor(Date. now() / 1000);
var matchtime = 120;
var options={retain:true,
	qos:2};

var result = [];
var val =0;
noOfPlayers=0;
var totalPoints=0;
var greenFlag=0;
var redFlag=0;
var noOfSupporter = 0;
var noOfOpposer = 0;
var playermap = new Map();
var gameAvgScore=0;
var resultjson = {};
var playerslist = [];
var express = require('express');
var app = express();

// created node server with express
app.use(express.static('public'));
let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
  PORT = 5100;
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
  
});




//mqtt connection object 

var client  = mqtt.connect("mqtt://test.mosquitto.org",{clientId:"mqttjs02"});

//Before we receive any messages we will need to be subscribed to a topic.
//The message event is triggered when a new message arrives.To process this event we need to create a listener.The callback needs to accept three parameters.-topic,message and packet.

client.on('message',function(topic, message, packet){
	console.log("topic is "+ topic);
	console.log("message is "+ message);

	// lifeline of game is received here
	if (topic==='gametime')
	{
		matchtime=parseInt(JSON.parse(message));
	}
	
	// player's game activity is received here
	if (topic==='gameresult'){
		result.push(JSON.parse(message));

	return;
	}
	
	// global clock is set here and also game is started at server.
	else if (topic==='gamestarter'&& message=='starttimer'&& gamestate==0)
	{

		var starttime=Math. floor(Date. now() / 1000);
		var startTime = new Date().getTime();
		client.publish("gamestatus",String(1),options);
		var interval = setInterval(function(){
    	if(new Date().getTime() - startTime > (matchtime*1000)){
			clearInterval(interval);
			//client.publish("games","timeover",options);
			return;
		
    }else{
		
		remainingtime = matchtime-( Math. floor(Date. now() / 1000)-starttime) 	
		console.log(remainingtime)
		client.publish("remainingtime",String(remainingtime),options);
	}
    //do whatever here..
}, 1000);
		gamestate=1;
		globaltime = Math. floor(Date. now() / 1000);
	}
	

});


//The MQTT protocol acknowledges a connection with the CONNACK message.
//This raises the on_connect event in the client which can be examined by creating a listener as follows:

var c =0;
if(c==0){
c=1;	
client.on("connect",function(){	
console.log("connected  "+ client.connected);

})}



//handle errors
client.on("error",function(error){
console.log("Can't connect" + error);
process.exit(1)});

// 
function subscription() 
{

	currenttime = Math. floor(Date. now() / 1000);
	if(currenttime-globaltime == matchtime &&gamestate==1)
		{
	
			gamestate=0;
			client.publish("gamestatus",String(0),options);
			console.log("game is over");
			//console.log(result);
			for(var i=0;i<result.length;i++)
			{
				
				if(playermap.get(result[i]["playerId"])!=undefined)
				{
					val= playermap.get(result[i]["playerId"])+result[i]["pointsScored"];
					
					playermap.set(result[i]["playerId"],val);
					
				
				}
				else{
					
					playermap.set(result[i]["playerId"],result[i]["pointsScored"]);
					if(result[i]["isFlagRed"]==true)
					{
						noOfOpposer = noOfOpposer+1;
					}
					

				}
				if(result[i]["isFlagRed"]==true)
				{
					redFlag=redFlag+1;
				}
				else{
					greenFlag=greenFlag+1;
				}

			}
			console.log(playermap.keys);
			console.log(playermap.values);
			for(var player of playermap)
			{ 
				console.log(player);
				if(player[1]==undefined)
				{continue;}
				var players ={};
				players[player[0]]=player[1];
				playerslist.push(players);
				totalPoints = totalPoints+player[1];
				noOfPlayers=noOfPlayers+1;
			
			}
			gameAvgScore=totalPoints/noOfPlayers;
			noOfSupporter=noOfPlayers-noOfOpposer;
			console.log(noOfPlayers);
			console.log(totalPoints);
			console.log(gameAvgScore);
			console.log(greenFlag);
			console.log(redFlag);
			resultjson["players"] = playerslist;
			resultjson["gameAvg"]=gameAvgScore;
			resultjson["redFlag"]=redFlag;
			resultjson["greenFlag"]=greenFlag-1;
			resultjson["supporter"]=noOfSupporter;
			resultjson["opposer"]=noOfOpposer;
			console.log(resultjson)
			result=[];
			playermap.clear();
			totalPoints=0;
			noOfPlayers=0;
			gameAvgScore=0;
			val =0;
			
			greenFlag=0;
			redFlag=0;
			noOfOpposer=0;
			noOfSupporter=0;
			client.publish("gameresult",JSON.stringify({}),options)
			client.publish("gamestarter","stoptimer",options);
			client.publish("finalresult",JSON.stringify(resultjson),options);
			resultjson={};
			playerslist=[];
			
	
		}
	

}
var topic_list=["gameresult","gamestarter","gametime"];
client.subscribe(topic_list,{qos:2});
//client.subscribe("start",{qos:2});
var options={retain:true,
	qos:2};
var timer_id=setInterval(function(){subscription();},1000);