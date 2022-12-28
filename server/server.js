//IP Address: http://54.163.140.115/project5

const crypto = require('crypto'); 

//some webserver libs
const express = require('express');
const bodyParser = require('body-parser');
const auth = require('basic-auth');

//database connector
const redis = require('redis');
//make redis use promises

//create db client
const client = redis.createClient();
const clientPromise = client.connect()

const port = process.env.NODE_PORT || 3000;

//make sure client connects correctly.
client.on("error", function (err) {
    console.log("Error in redis client.on: " + err);
});

const setUser = function(userObj){
	return client.HSET("user:"+userObj.id, userObj ).then(function(){
		console.log('Successfully created (or overwrote) user '+userObj.id);
	}).catch(function(err){
		console.error("WARNING: errored while attempting to create tester user account");
		console.error(err)
	});

}

clientPromise.then(()=>{
	//make sure the test user credentials exist
	const userObj = {
		salt: new Date().toString(),
		id: 'teacher'
	};
	userObj.hash = crypto.createHash('sha256').update('testing'+userObj.salt).digest('base64');
	//this is a terrible way to do setUser
	//I'm not waiting for the promise to resolve before continuing
	//I'm just hoping it finishes before the first request comes in attempting to authenticate
	setUser(userObj);

})


//start setting up webserver
const app = express();

//decode request body using json
app.use(bodyParser.json());

//allow the API to be loaded from an application running on a different host/port
app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
		res.header('Access-Control-Expose-Headers', 'X-Total-Count');
	res.header('Access-Control-Allow-Methods', "PUT, DELETE, POST, GET, HEAD");
		next();
});

//protect our API
app.use(function(req,res,next){
	switch(req.method){
		case "GET":
		case "POST":
		case "PUT":
		case "DELETE":
			//extract the given credentials from the request
			const creds = auth(req);
			
			//TODO - DONE
			//look up userObj using creds.name
			//use creds.name to lookup the user object in the DB
			//use the userObj.salt and the creds.pass to generate a hash
			//compare the hash, if they match call next() and do not use res object
			//to send anything to client
			//if they dont or DB doesn't have the user or there's any other error use the res object 
			//to return a 401 status code

			client.HGETALL(`user:${creds.name}`)
			.then((userObj) => {
				if (!userObj) return res.sendStatus(401);

				const givenHash = crypto.createHash('sha256')
					.update(creds.pass+userObj.salt)
					.digest('base64');

				if (givenHash !== userObj.hash) return res.sendStatus(401);
				
				next();
			})
			.catch(() => res.sendStatus(401))

			break;
		default:
			//maybe an options check or something
			next();
			break;
	}
});

//this takes a set of items and filters, sorts and paginates the items.
//it gets it's commands from queryArgs and returns a new set of items
const filterSortPaginate = (type, queryArgs, items) =>{
	let keys;

	//create an array of filterable/sortable keys
	if(type == 'student'){
		keys = ['id','name'];
	}else{
		keys = ['id','student_id','type','max','grade'];
	}

	//applied to each item in items
	//returning true keeps item
	//TODO - DONE
	//fill out the filterer function
	const filterer = (item) =>{
		//loop through keys defined in above scope
			//if this key exists in queryArgs
			//and it's value doesnt match whats's on the item
			//don't keep the item (return false)
		//else return true

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (!queryArgs[key]) continue;
			if (!item[key].toLowerCase().includes(queryArgs[key])) return false;
		}
		return true;
	};

	//apply above function using Array.filterer
	items = items.filter(filterer);
	console.log('items after filter:',items)

	//always sort, default to sorting on id
	if(!queryArgs._sort){
		queryArgs._sort = 'id';
	}
	//make sure the column can be sorted
	let direction = 1;
	if(!queryArgs._order){
		queryArgs._order = 'asc';
	}
	if(queryArgs._order.toLowerCase() == 'desc'){
		direction = -1;
	}

	//comparator...given 2 items returns which one is greater
	//used to sort items
	//written to use queryArgs._sort as the key when comparing
	//TODO - DONE
	//fill out the sorter function
	const sorter = (a,b)=>{
		//Note direction and queryArgs are available to us in the above scope

		//compare a[queryArgs._sort] (case insensitive) to the same in b
		//save a variable with 1 if a is greater than b, -1 if less and 0 if equal
		
		//multiply by direction to reverse order and return the variable

		const keyToSortBy = queryArgs._sort;
		
		if (a[keyToSortBy].toLowerCase() === b[keyToSortBy].toLowerCase()) return 0;
		
		//Does this work? switch > to <? test it and make sure
		if (a[keyToSortBy].toLowerCase() > b[keyToSortBy].toLowerCase()) return 1 * direction;
		
		return -1 * direction;
	};

	//use apply the above comparator using Array.sort
	items.sort(sorter);
	console.log('items after sort:',items)
	//if we need to paginate
	if(queryArgs._start || queryArgs._end || queryArgs._limit){
		//TODO - Maybe done- need to test
		//fill out this if statement
		//define a start and end variable
		//start defaults to 0, end defaults to # of items

		//if queryArgs._start is set, save into start
		//if queryArgs._end is set save it into end
		//	else if queryArgs._limit is set, save end as start+_limit
		
		let start = 0, end = items.length;
		if (queryArgs._start) start = queryArgs._start;
		if (queryArgs._end) end = queryArgs._end;
		else if (queryArgs._limit) end = start + queryArgs._limit;

		//save over items with items.slice(start,end)
		items = items.slice(start, end);
	}
	console.log('items after pagination:',items)
	return items;
};

app.get('/students/:id',function(req,res){
	//TODO
	//Hint use HGETALL
	const id = req.params.id;
	
	client.HGETALL(`student:${id}`)
	.then((student) => { //res is an object
		//If the user doesn't exist
		if (!student.id) {
			console.log("Response is empty");
			return res.sendStatus(404);
		}

		return res.json({...student, _ref:`/students/${student.id}`});
	})
});
app.get('/students',function(req,res){
	//TODO
	//fill out the function
	//Hint: use SMEMBERS, then an array of promises from HGETALL and 
	//Promise.all to consolidate responses and filter sort paginate and return them

	client.SMEMBERS("students")
	.then((students) => { //students is an array of strings, which are student IDs
		res.setHeader("X-Total-Count", students.length);

		if (students.length < 1) {
			return res.json([]);
		}

		const promises = [];
		for (let i = 0; i < students.length; i++) {
			const id = students[i];
			promises.push(
				client.HGETALL(`student:${id}`)
				.then((studentObj) => ({...studentObj, _ref:`/students/${studentObj.id}`})) //() infers a return statement
			);
		}

		Promise.all(promises)
		.then((studentObjs) => {
			res.json(filterSortPaginate("student", req.query, studentObjs));
		});
	})
});

app.post('/students',function(req,res){
	//TODO
	//Hint: use sadd and HSET
	const student = req.body;

	if (!student || student == null) {
		console.log("No body given");
		return res.sendStatus(400);
	}
	if (!student.id || student.id === "") {
		console.log("No student ID given");
		return res.sendStatus(400);
	}
	if (!student.name || student.name === "") {
		console.log("No student name given");
		return res.sendStatus(400);
	}

	//Add student to the set
	client.SADD("students", student.id)
	.then((response) => { //res is 0 r 1 (number)
		if (response < 1) {
			//the student already exists, bail
			console.log(`student ${student.id} already exists in the set`);
			return res.sendStatus(400);
		}

		client.HSET(`student:${student.id}`, student)
		.then((response) => { //res is number
			if (response < 1) {
				console.log(`Nothing was set in the hash`);
				return res.sendStatus(500);
			}

			return res.json({...student, _ref: `/students/${student.id}`});
		})
	})
});
app.delete('/students/:id',function(req,res){
	//TODO
	//Hint use a Promise.all of DEL and SREM
	//Delete the hash student:${id}
	//Delete the student's id from the set called "students"

	let id = req.params.id;
	const promises = [
		client.DEL(`student:${id}`),
		client.SREM("students", id)
	];

	Promise.all(promises)
	.then((response) => {
		if (response[0] < 1 || response[1] < 1) return res.sendStatus(404);
		return res.json({id: id, "_ref":`/students/${id}`});
	})
});
app.put('/students/:id',function(req,res){
	//TODO
	//Hint: use client.HEXISTS and HSET
	const id = req.params.id;
	const body = req.body;

	if (!body) {
		console.log("Empty request body");
		return res.sendStatus(400);
	}
	if (body.id) {
		console.log("Id cannot be updated");
		return res.sendStatus(400);
	}

	client.HEXISTS(`student:${id}`, "id")
	.then((response) => { //returns true if the id exists
		if (!response) {
			console.log("User not found");
			return res.sendStatus(404);
		}

		client.HSET(`student:${id}`, body)
		.then((response) => { //int, number of fields added
			
			//Return the modified student obj
			client.HGETALL(`student:${id}`)
			.then((student) => { //res is an object
				//If the user doesn't exist
				if (!student.id) {
					console.log("Response is empty");
					return res.sendStatus(404);
				}
				return res.json({...student, _ref:`/students/${student.id}`});
			})
		})
	})
});

app.post('/grades',function(req,res){
	//TODO
	//Hint use INCR and HSET
	const body = req.body;

	if (!body || body == null) {
		console.log("Empty req body");
		res.sendStatus(400);
	}
	if (!body.student_id || !body.type || !body.max || !body.grade) {
		console.log("Missing some req key(s)");
		res.sendStatus(400);
	}

	let gradeNum = 0;
	client.INCR("grades")
	.then((id) => { //value of the key after INCR		
		body.id = id.toString();
		client.HSET(`grade:${id}`, body)
		.then((response) => { //number of fields added
			if (response < 1) {
				console.log("Error adding the grade");
				return res.sendStatus(500);
			}
			return res.json({...body, _ref: `/grades/${id}`});
		})
	})
});
app.get('/grades/:id',function(req,res){
	//TODO
	//Hint use HGETALL
	const id = req.params.id;
	
	client.HGETALL(`grade:${id}`)
	.then((grade) => { //res is an object
		//If the user doesn't exist
		if (!grade.id) {
			console.log("Response is empty");
			return res.sendStatus(404);
		}

		return res.json({...grade, _ref:`/grades/${id}`});
	})
});
app.put('/grades/:id',function(req,res){
	//TODO
	//Hint use HEXISTS and HSET
	const id = req.params.id;
	const body = req.body;

	if (!body) {
		console.log("Empty request body");
		return res.sendStatus(400);
	}

	client.HEXISTS(`grade:${id}`, "id")
	.then((response) => { //returns true if the id exists
		if (!response) {
			console.log("Grade not found");
			return res.sendStatus(404);
		}

		client.HSET(`grade:${id}`, body)
		.then((response) => { //int, number of fields added
			
			//Return the modified grade obj
			client.HGETALL(`grade:${id}`)
			.then((grade) => { //res is an object
				//If the user doesn't exist
				if (!grade.id) {
					console.log("Response is empty");
					return res.sendStatus(404);
				}
				return res.json({...grade, _ref:`/grades/${id}`});
			})
		})
	})
});
app.delete('/grades/:id',function(req,res){
	//TODO
	//Hint use DEL .....duh
	const id = req.params.id;

	client.DEL(`grade:${id}`)
	.then((response) => {
		console.log(response);
		if (response < 1) {
			console.log("Id does not exist");
			return res.sendStatus(404);
		}
		return res.json({"_ref":`/grades/${id}`});
	})
});
app.get('/grades',function(req,res){
	//TODO
	//Hint use GET, HGETALL
	//and consolidate with Promise.all to filter, sort, paginate
	let totalGrades = 0;

	client.GET("grades")
	.then((response) => {
		totalGrades = parseInt(response);

		if (totalGrades === null || totalGrades < 1) {
			res.setHeader("X-Total-Count", 0);
			return res.json([]);
		}
		
		const promises = [];
		for (let i = 1; i <= totalGrades; i++) {
			const id = i;
			promises.push(
				client.HGETALL(`grade:${id}`)
				.then((gradeObj) => {
					if (!gradeObj.id) return null;
					return {...gradeObj, _ref:`/grades/${id}`};
				})
			);
		}

		Promise.all(promises)
		.then((gradeObjs) => {
			//remove null gradeObjs before filterSortPaginate
			gradeObjs = gradeObjs.filter(g => g !== null);
			res.setHeader("X-Total-Count", gradeObjs.length);
			res.json(filterSortPaginate("grade", req.query, gradeObjs));
		});
	})
});

app.delete('/db',function(req,res){
	client.FLUSHALL().then(function(){
		//make sure the test user credentials exist
		const userObj = {
			salt: new Date().toString(),
			id: 'teacher'
		};
		userObj.hash = crypto.createHash('sha256').update('testing'+userObj.salt).digest('base64');
		//this is a terrible way to do setUser
		//I'm not waiting for the promise to resolve before continuing
		//I'm just hoping it finishes before the first request comes in attempting to authenticate
		setUser(userObj).then(()=>{
			res.sendStatus(200);
		});
	}).catch(function(err){
		res.status(500).json({error: err});
	});
});

clientPromise.then(()=>{
	app.listen(port, function () {
	console.log('Example app listening on port '+port+'!');
	});
})