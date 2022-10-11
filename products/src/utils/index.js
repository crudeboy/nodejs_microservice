const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const amqplib = require("amqplib");

const { APP_SECRET, MESSAGE_BROKER_URL, EXCHANGE_NAME, SHOPPING_BINDING_KEY, CUSTOMER_BINDING_KEY } = require("../config");

//Utility functions
(module.exports.GenerateSalt = async () => {
	return await bcrypt.genSalt();
}),
	(module.exports.GeneratePassword = async (password, salt) => {
		return await bcrypt.hash(password, salt);
	});

module.exports.ValidatePassword = async (enteredPassword, savedPassword, salt) => {
	return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

(module.exports.GenerateSignature = async (payload) => {
	return await jwt.sign(payload, APP_SECRET, { expiresIn: "1d" });
}),
	(module.exports.ValidateSignature = async (req) => {
		const signature = req.get("Authorization");

		if (signature) {
			try {
				const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
				req.user = payload;
				return true;
			} catch (error) {
				console.log("********error while validating user", error, "********error while validating user");
			}
		}

		return false;
	});

module.exports.FormateData = (data) => {
	if (data) {
		return { data };
	} else {
		throw new Error("Data Not found!");
	}
};

// module.exports.PublishCustomerEvent = async (payload) => {
// 	axios.post("http://localhost:8000/customer/app-events", {
// 		payload,
// 	});
// };

// module.exports.PublishShoppingEvent = async (payload) => {
// 	axios.post("http://localhost:8000/shopping/app-events", {
// 		payload,
// 	});
// };

//message broker
//create a channel
module.exports.CreateChannel = async () => {
	try {
		const connection = await amqplib.connect(MESSAGE_BROKER_URL);
		const channel = await connection.createChannel();
		await channel.assertExchange(EXCHANGE_NAME, "direct", false);
		return channel;
	} catch (error) {
		throw error;
	}
};

//publish a message
module.exports.PublishMessage = async (channel, binding_key, message) => {
	try {
		await channel.publish(EXCHANGE_NAME, binding_key, Buffer.from(message));
                console.log("****** new message has been published ******")
	} catch (error) {
		throw error;
	}
};

//subscribe for a message
module.exports.SubscribeMessage = async (channel, service, binding_key) => {
	try {
		const appQueue = await channel.asssertQueue(QUEUE_NAME);
		channel.bindQueue(appQueue, EXCHANGE_NAME, binding_key);
		channel.consume(appQueue.queue, data => {
			console.log("received data");
			console.log(data.content.toString());
			channel.ack(data);
		});
	} catch (error) {
                throw error;
        }
};
