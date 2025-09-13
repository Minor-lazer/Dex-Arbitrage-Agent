Welcome to the DEX Radar System repo 
The frontend code is in the main branch and the backend code is in the dev branch

Steps to launch frontend
1. Clone the main branch 
2. Once cloned , do an npm i and install all dependencies
3. Run the command "npm run dev"

Steps to launch backend
1. Clone the dev branch
2. Do an npm i , to install all the dependencies
3. You need to creat an groq API key , to see the AI in action and also an alchemy RPC end point for ethereum RPC calls
4. Once the api keys are created , store them in your .env file in local with the following names
5. RPC_URL= https://eth-mainnet.g.alchemy.com/v2/<your API KEY >
   PORT= your localhost port
   GROQ_API_KEY = your groq API end point
6. Once .env is sorted run the command "node index.js"
7. The MVP UI would look like the below
   <img width="1920" height="809" alt="Screenshot (419)" src="https://github.com/user-attachments/assets/25a597f5-68ad-4f91-acc8-a07a685d5484" />





