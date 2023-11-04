import { Server } from "socket.io";

const generateRandomPosition = () => {
	return [Math.random() * 20 - 10, 0, Math.random() * 20 - 10];
};

const generateRandomHexColor = () => {
	return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

export const generateCharacter = (id: string) => ({
	id,
	position: generateRandomPosition(),
	hairColor: generateRandomHexColor(),
	skinColor: generateRandomHexColor(),
	topColor: generateRandomHexColor(),
	bottomColor: generateRandomHexColor(),
});

const io = new Server({
	cors: {
		origin: "http://localhost:3002",
	},
});
io.listen(3003);

const characters: ReturnType<typeof generateCharacter>[] = [];

io.on("connection", (socket) => {
	console.log(`connected: ${socket.id}`);

	characters.push(generateCharacter(socket.id));
	console.log(`Currently ${characters.length} characters`);

	io.emit("characters", characters);

	socket.on("move", (position) => {
		const character = characters.find(
			(character) => character.id === socket.id
		);
		if (character) {
			character.position = position;
			io.emit("characters", characters);
		}
	});

	socket.emit("hello");

	socket.on("message", (data) => {
		console.log(data);
	});

	socket.on("disconnect", () => {
		console.log("disconnected");

		characters.splice(
			characters.findIndex((character) => character.id === socket.id),
			1
		);
		io.emit("characters", characters);
	});
});
