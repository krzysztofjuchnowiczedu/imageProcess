var express = require('express');
var router = express.Router();
var Policy = require("../s3post").Policy;
var S3Form = require("../s3post").S3Form;
var helpers = require("../helpers");

var AWS_CONFIG_FILE = "config.json";
var POLICY_FILE = "policy.json";

router.get('/', function(req, res, next) {

    var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);
    var policyData = helpers.readJSONFile(POLICY_FILE);
    var policy = new Policy(policyData);
    var s3Form = new S3Form(policy);
    var bucketName = policy.getConditionValueByKey("bucket");
    var formFields = s3Form.generateS3FormFields();
    formFields = s3Form.addS3CredientalsFields(formFields, awsConfig);


    res.render('uploadToS3', {
      bucket: bucketName,
        fields: formFields
    });
});

module.exports = router;
