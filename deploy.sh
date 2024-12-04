#!/bin/bash

aws s3 cp delayedgratification.js s3://vasarmilan-public/delayedgratification.js
echo "Deployed to s3://vasarmilan-public/delayedgratification.js"
echo "URL: https://vasarmilan-public.s3.us-east-1.amazonaws.com/delayedgratification.js"

aws s3 cp mindfulpostload.js s3://vasarmilan-public/mindfulpostload.js
echo "Deployed to s3://vasarmilan-public/mindfulpostload.js"
echo "URL: https://vasarmilan-public.s3.us-east-1.amazonaws.com/mindfulpostload.js"
