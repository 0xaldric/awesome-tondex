import * as dotenv from "dotenv";
import * as Joi from "joi";

dotenv.config();

const envVarsSchema = Joi.object()
    .keys({
        TON_HTTP_ENDPOINT: Joi.string().required(),
        TON_HTTP_API_KEY: Joi.string().required(),
        WALLET1_MNEMONIC: Joi.string().required(),
        WALLET2_MNEMONIC: Joi.string().required(),
        WALLET3_MNEMONIC: Joi.string().required()
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: "key" } }).validate(process.env);

if (error != null) {
    throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
    tonHttpEndpoint: envVars.TON_HTTP_ENDPOINT,
    tonHttpApiKey: envVars.TON_HTTP_API_KEY,
    walletMnemonic: [
        envVars.WALLET1_MNEMONIC,
        envVars.WALLET2_MNEMONIC,
        envVars.WALLET3_MNEMONIC
    ]
};