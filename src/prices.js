import { ethers,formatUnits } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const UniswapPair = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"; // USDC/WETH Uniswap V2
const SushiswapPair = "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0"; // USDC/WETH Sushiswap

const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

async function getPairPrice(pairAddress) {
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  const t0 = new ethers.Contract(token0, ERC20_ABI, provider);
  const t1 = new ethers.Contract(token1, ERC20_ABI, provider);

  const [dec0Raw, dec1Raw, sym0, sym1] = await Promise.all([
    t0.decimals(),
    t1.decimals(),
    t0.symbol(),
    t1.symbol()
  ]);


  const dec0 = Number(dec0Raw);
  const dec1 = Number(dec1Raw);
  const r0 = parseFloat(formatUnits(reserve0,dec0));
  const r1 = parseFloat(formatUnits(reserve1,dec1));


  const price = (r0 / (10 ** dec0)) / (r1 / (10 ** dec1));

  return {
    pairAddress,
    token0,
    token1,
    symbol0: sym0,
    symbol1: sym1,
    decimals: [dec0, dec1],
    reserves: [reserve0.toString(), reserve1.toString()],
    price
  };
}

export async function getPrices() {
  const [uniswapPrice, sushiswapPrice] = await Promise.all([
    getPairPrice(UniswapPair),
    getPairPrice(SushiswapPair)
  ]);

  return {
    uniswap: uniswapPrice,
    sushiswap: sushiswapPrice,
    ethUSD: uniswapPrice.price 
  };
}
