#!/bin/bash

aws s3 cp poc.js s3://vasarmilan-public/poc.js
echo "Deployed to s3://vasarmilan-public/poc.js"
echo "URL: https://vasarmilan-public.s3.us-east-1.amazonaws.com/poc.js"