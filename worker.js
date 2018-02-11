const Consumer = require('sqs-consumer');
const AWS = require('aws-sdk');
var sqsHelper = require("./sqsHelper");
var AWS_CONFIG_FILE = "config.json";
var helpers = require("./helpers");
var Jimp = require("jimp");
const fs = require('fs');
var Policy = require("./s3post").Policy;
var POLICY_FILE = "policy.json";
var logger = require("./logger");
var policyData = helpers.readJSONFile(POLICY_FILE);
var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);
var policy = new Policy(policyData);
var bucketName = policy.getConditionValueByKey("bucket");

AWS.config.update({
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
    "region": awsConfig.region
});


const app = Consumer.create({
    queueUrl: sqsHelper.queueURL,
    handleMessage: function (message, done) {
        var message = message.Body;
        logger.logMessage(message, "WORKER - message recived");
        processPhoto(message);
        done();
    }
});

function processPhoto(message) {
    var parameters = message.split(";");
    var action = parameters[0];
    var imageID = parameters[1];

    var s3 = new AWS.S3();
    var path = getPathForImage(imageID);
    var imageStream = fs.createWriteStream(path);
    var temporaryImagePath = imageStream.path;
    var s3Parameters = {
        Bucket: bucketName,
        Key: "images/" + imageID
    };
    var s3ReadStream = s3.getObject(s3Parameters).createReadStream().pipe(imageStream);

    s3ReadStream.on('finish', function (err, data) {
       if(err){
           console.log(err);
           logger.logMessage(err, "ERROR - finish reading stream");

       } else{
           var logMessage = "Worker: action " + action;
           logger.logMessage(logMessage, "INFO - finish reading stream");
           console.log(logMessage);
           if (action.trim() == "rotate90") {
               rotateImageBy90Degrees(path);
           } else  if (action.trim() == "flip") {
               flipImage(path);
           }
       }
    });
}

function rotateImageBy90Degrees(imagePath){
    Jimp.read(imagePath, function (err, image) {
        if(err){
            console.log(err);
            logger.logMessage(err, "ERROR - Jimp reading file");
        } else{
            image.rotate(90).write(imagePath, function(err, data){
                if(err){
                    console.log(err);
                    logger.logMessage(err, "ERROR - Jimp rotate and write file");
                } else{
                    logger.logMessage(imagePath, "INFO - Jimp rotate");
                    console.log("Worker: send rotated file to s3 " + imagePath);
                    sendFileToS3(imagePath);
                }
            });
        }
    });
}

function sendFileToS3(imagePath){
    var inputFile = fs.readFile(imagePath, function(err, buffer){
        if(err){
            console.log(err);
            logger.logMessage(err, "ERROR - read input file");
        } else{
            var imageKey = imagePath.replace("./public/", "");
            var s3Parameters = {
                ACL: 'public-read',
                Bucket: bucketName,
                Key: imageKey,
                Body: buffer,
                ContentType: 'image/*'
            };
            var s3 = new AWS.S3();
            s3.putObject(s3Parameters, function (err2, data) {
                if(err2){
                    console.log(err);
                    logger.logMessage(err, "ERROR - S3 put object");
                } else {
                    var logMessage = "Image " + imageKey + " send to s3";
                    logger.logMessage(logMessage, "INFO - S3 put object");
                    console.log();
                }
                fs.unlink(imagePath);
            });
        }
    })
}

function flipImage(imagePath){
    Jimp.read(imagePath, function (err, image) {
        if(err){
            console.log(err);
            logger.logMessage(err, "ERROR - Jimp read file");

        } else{
            console.log("Worker: flip image started");
            image.mirror(true, false).write(imagePath, function(err, data){
                if(err){
                    console.log("Worker: flip image error: " + err);
                    logger.logMessage(err, "ERROR - Jimp mirror image");
                } else{
                    var logMessage = "Worker: send fliped file to s3 " + imagePath;
                    console.log(logMessage);
                    logger.logMessage(logMessage, "SUCCESSS - Jimp mirror image");
                    sendFileToS3(imagePath);
                }
            });
        }
    });
}

function getPathForImage(imageKey){
    var tempPath = "./public/images/";
    return tempPath + imageKey;
}

app.on('error', function(err) {
    console.log(err.message);
});

app.start();

console.log("Worker started");