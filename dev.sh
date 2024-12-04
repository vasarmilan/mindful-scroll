#!/bin/bash

# Watch for changes in poc.js and run deploy.sh on change
while inotifywait -e modify .; do
  ./deploy.sh
done
