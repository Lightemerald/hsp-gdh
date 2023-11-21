#!/bin/bash

secret=$(openssl rand -base64 32)
echo "Generated secret key $secret"
