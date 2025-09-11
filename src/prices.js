import { ethers, formatUnits } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// USDC/WETH pairs
const UniswapPair = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
const SushiswapPair = "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0";

export async function getPriceForPair(pairAddress) {
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

  const r0 = parseFloat(formatUnits(reserve0, dec0));
  const r1 = parseFloat(formatUnits(reserve1, dec1));

  let price;
  if (sym0 === "USDC" && sym1 === "WETH") {
    // ETH/USD = USDC reserve ÷ WETH reserve
    price = r0 / r1;
  } else if (sym0 === "WETH" && sym1 === "USDC") {
    price = r1 / r0;
  } else {
    throw new Error("Unexpected pair tokens: need USDC/WETH");
  }

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

// Get both prices for arbitrage
export async function getPrices() {
  const [uniswap, sushiswap] = await Promise.all([
    getPriceForPair(UniswapPair),
    getPriceForPair(SushiswapPair)
  ]);

  const spread = ((uniswap.price - sushiswap.price) / sushiswap.price) * 100;

  return {
    uniswap,
    sushiswap,
    spread,
    opportunity: Math.abs(spread) > 0.5, // >0.5% difference
    buyFrom: uniswap.price < sushiswap.price ? "Uniswap" : "Sushiswap",
    sellTo: uniswap.price < sushiswap.price ? "Sushiswap" : "Uniswap"
  };
}
