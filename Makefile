setup: package.json
	sudo add-apt-repository ppa:chris-lea/node.js -y
	sudo apt-get update
	sudo apt-get install nodejs -y
	npm config set registry http://registry.npmjs.org/
	sudo npm install -g nodemon
	sudo npm install

	sudo port install mongodb || sudo apt-get install mongodb
	NODE_ENV=development

db-import:
	mongod &
	mongorestore --db events --colection events db_dump/events.bson
	killall -15 mongod

deploy:
	ssh events@projects.rosedu.org /home/events/deploy.sh
