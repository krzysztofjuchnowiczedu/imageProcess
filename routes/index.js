var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Policy = require("../s3post").Policy;
var helpers = require("../helpers");
var bucketURL = "https://s3-us-west-1.amazonaws.com/krzysztof-juchnowicz/";
var AWS_CONFIG_FILE = "config.json";
var POLICY_FILE = "policy.json";
var sqsHelper = require("../sqsHelper");
var logger = require("../logger");

router.get('/', function(req, res, next) {
    // var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);
    // var policyData = helpers.readJSONFile(POLICY_FILE);
    // var policy = new Policy(policyData);
    // var bucketName = policy.getConditionValueByKey("bucket");
    //
    // AWS.config.update({
    //     accessKeyId: awsConfig.accessKeyId,
    //     secretAccessKey: awsConfig.secretAccessKey,
    //     "region": awsConfig.region
    // });
    //
    // var s3 = new AWS.S3();
    //
    // var params = {
    //     Bucket: bucketName,
    //     Prefix: "images"
    // };
    //
    // s3.listObjectsV2(params, function (err, data) {
    //     if(err){
    //         logger.logMessage(err, "ERROR - list objects");
    //         console.log("List objects Error: " + err);
    //     } else{
    //         var images = [];
    //         data.Contents.forEach(function(image) {
    //             images.push(image.Key);
    //         });
    //
    //         res.render('index', {
    //             title: 'Image upload',
    //             images: images,
    //             bucketURL: bucketURL
    //         });
    //     }
    // });
    res.sendStatus(200);
});

router.post('/', function(req, res, next) {
    var imageIDList = req.body.imageID;
    var action = req.body.actionRadios;
    if(imageIDList && action){
        sqsHelper.sendToSQS(imageIDList, action);
    }
    res.redirect("/");
});

router.get("/delete", function (req, res, next) {
    var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);
    var policyData = helpers.readJSONFile(POLICY_FILE);
    var policy = new Policy(policyData);
    var bucketName = policy.getConditionValueByKey("bucket");

    AWS.config.update({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        "region": awsConfig.region
    });
    var imageID = req.param("imageID");
    if(imageID){
        console.log("Delete: " + imageID);
        var params = {
            Bucket: bucketName,
            Key: "images/" + imageID
        };

        var s3 = new AWS.S3();

        s3.deleteObject(params, function (err, data) {
           if(err){
               console.log("Error: " + err);
               logger.logMessage(err, "ERROR - delete objects from S3");

           } else {
               var message = "Object " + params.Key + " deleted";
               logger.logMessage( message, "SUCCESS - delete objects from S3");
               console.log(message);
           }
        });
    }
    res.redirect("/");

});

module.exports = router;
