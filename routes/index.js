var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Policy = require("../s3post").Policy;
var helpers = require("../helpers");
var bucketURL = "https://s3-us-west-1.amazonaws.com/krzysztof-juchnowicz/";
var AWS_CONFIG_FILE = "config.json";
var POLICY_FILE = "policy.json";
var sqsHelper = require("../sqsHelper");

/* GET home page. */
router.get('/', function(req, res, next) {
    var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);
    var policyData = helpers.readJSONFile(POLICY_FILE);
    var policy = new Policy(policyData);
    var bucketName = policy.getConditionValueByKey("bucket");

    AWS.config.update({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        "region": awsConfig.region
    });

    var s3 = new AWS.S3();

    var params = {
        Bucket: bucketName,
        Prefix: "images"
    };

    s3.listObjectsV2(params, function (err, data) {
        if(err){
            console.log("Error: " + err);
        } else{
            var images = [];
            data.Contents.forEach(function(image) {
                images.push(image.Key);
            });

            res.render('index', {
                title: 'Image upload',
                images: images,
                bucketURL: bucketURL
            });
        }

    });

});

router.post('/', function(req, res, next) {
    var imageIDList = req.body.imageID;
    if(imageIDList){
        sqsHelper.sendToSQS(imageIDList);
    }

    res.redirect("/");
});





module.exports = router;
