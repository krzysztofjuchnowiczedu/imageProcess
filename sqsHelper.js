var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var logger = require("./logger");
var queueURL = "https://sqs.us-west-1.amazonaws.com/451570634445/KrzysztofJuchnowicz";

var sendToSQS = function(imageIDList, action) {
    var sqs = new AWS.SQS();
    var entries = [];
    if(imageIDList){
        if(Array.isArray(imageIDList)){
            imageIDList.forEach(function(image) {
                var message = action + ";" + image;
                var entry = {
                    MessageBody: message,
                    DelaySeconds: 0,
                    Id: uuid.v1()
                };
                entries.push(entry);
            });
        } else{
            var message = action + ";" + imageIDList;
            var entry = {
                MessageBody: message,
                DelaySeconds: 0,
                Id: uuid.v1()
            };
            entries.push(entry);
        }
    }

    var parameters = {
        Entries: entries,
        QueueUrl: queueURL
    };

    sqs.sendMessageBatch(parameters, function (err, data) {
        if(err){
            console.log(err);
            logger.logMessage(err, "ERROR - send messages to SQS");
        }else{
            logger.logMessage(JSON.stringify(entries), "SUCCESS - send messages to SQS");
            console.log("Response " + data.Successful.length);
        }
    });
};

exports.sendToSQS = sendToSQS;
exports.queueURL = queueURL;