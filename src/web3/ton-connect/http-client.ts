import { env } from "@/config";
import { TonClient } from "@ton/ton";

const tonHttpClient = new TonClient({
    endpoint: env.tonHttpEndpoint,
    apiKey: env.tonHttpApiKey
})

export default tonHttpClient