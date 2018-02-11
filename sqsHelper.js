var AWS = require('aws-sdk');
var uuid = require('node-uuid');

var queueURL = "https://sqs.us-west-1.amazonaws.com/451570634445/KrzysztofJuchnowicz";



var sendToSQS = function(imageIDList) {
    var sqs = new AWS.SQS();

    var entries = [];

    imageIDList.forEach(function(image) {
        var entry = {
            MessageBody: image,
            DelaySeconds: 0,
            Id: uuid.v1()
        };
        entries.push(entry);
    });

    var parameters = {
        Entries: entries,
        QueueUrl: queueURL
    };

    sqs.sendMessageBatch(parameters, function (err, data) {
        if(err){
            console.log(err);
        }else{
            console.log("Response " + data.Successful.length);
        }
    });

    console.log("Images sent to SQS: " + imageIDList);
};

exports.sendToSQS = sendToSQS;