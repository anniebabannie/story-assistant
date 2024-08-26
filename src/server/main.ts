import dotenv from 'dotenv';
import express from "express";
import { readFileSync } from "fs";
import { Ollama } from "ollama";
import ViteExpress from "vite-express";
import { Sequelize, Model, DataTypes } from 'sequelize';


dotenv.config();
const app = express();

// SQLite stuff
// const sequelize = new Sequelize('sqlite:///data/database.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/database.sqlite'
});

class User extends Model {}
User.init({
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING
}, { sequelize, modelName: 'user' });

sequelize.sync();

// ollama stuff
const ollama = new Ollama({ host: process.env.OLLAMA_HOST });
app.use(express.json());

app.get('/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const user = await User.create({ name: "John Doe", email: "johndoe@gmail.com", password: "password" });
  res.json(user);
});

app.post("/prompt", async (_, res) => {
  console.log(process.env.OLLAMA_HOST);
  const prompt = "List all the characters in the story.";
  const context = readFileSync("src/story.txt", "utf-8");

  const resp = await ollama.generate({
    model: "llama3.1:latest",
    prompt: `You are a writing assistant that helps me with whatever questions or problems I have with my story. \n
            I will mark the begining and end of the story with [BEGINNING] and [END] respectively. \n
            [BEGINNING] ${context} [END] \n
            Note that this is an incomplete story, some parts might conflict, the order of events aren't quite set in stone. 
            Respond with a helpful response to the following prompt:\n\n${prompt}`,
    stream: false
  })

  res.status(200).json({ result: resp.response });
});

app.post("/summarize", async (_, res) => {
  console.log("Getting characters...")
  const context = readFileSync("src/story.txt", "utf-8");

  const jsonPattern = JSON.stringify({
        summary: "A one to two paragraph summary of what happens in this chapter.",
        characters: [
          {
            name: "The name of the character",
            description: "A brief description of the character"
          }
        ]
  });

  const resp = await ollama.generate({
    model: "llama3.1:latest",
    prompt: `Provide me with a JSON object with details about this chapter in the story. \n
    The JSON object must follow the following JSON patter: ${jsonPattern}.  \n
            I will mark the begining and end of the story with [BEGINNING] and [END] respectively. \n
            [BEGINNING] ${context} [END] \n`,
    stream: false,
    format: "json"
  })
  console.log(resp.response);
  res.status(200).json({ result: resp.response });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
