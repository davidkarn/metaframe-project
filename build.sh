#!/bin/bash
anchor build
anchor deploy
cp target/idl/mysolanaapp.json app/src/idl.json
cp target/idl/mf_moderation.json app/public/defprogram.json
cp target/idl/mf_anti_elevator_moderation.json app/public/anti_elevator.json

# in hosts file metaframe.io must be pointing to localhost
cd app/public
npm install
webpack
http-server -S
