#!/bin/sh

npm test && (cat `ls -t output.txt-* | head -1`)
