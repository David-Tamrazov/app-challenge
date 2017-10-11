#!/bin/bash

echo "enter mysql root password"

read rootpass

mysql -uroot -p$rootpass <<SETUP_DB

CREATE DATABASE IF NOT EXISTS $1;
GRANT USAGE ON *.* TO $2@localhost IDENTIFIED BY '$3';
GRANT ALL PRIVILEGES ON $1.* TO $2@localhost;
FLUSH PRIVILEGES;

SETUP_DB

echo "Database ready."
