var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var AWS_CONFIG_FILE = "config.json";
var helpers = require("./helpers");
var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);

AWS.config.update({
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
    "region": awsConfig.region
});

var logMessage = function (message, name) {
    var timestamp = new Date().toISOString();
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "Logs",
        Item: {
            "uuid":  uuid.v1(),
            "name": name,
            "message": message,
            "timestamp": timestamp
        }
    };
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add log. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Log succeeded:", name);
        }
    });
};

exports.logMessage = logMessage;