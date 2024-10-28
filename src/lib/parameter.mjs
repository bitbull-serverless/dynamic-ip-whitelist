import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
const ssm = new SSMClient()

class Parameter {
	/**
   * Parameter constructor
   * 
   * @param {string} parameterName
   */
	constructor(parameterName) {
		this.parameterName = parameterName
	}

	/**
   * Get Parameter value
   * 
   * @returns {Promise<string>}
   */
	async getValue() {
		const res = await ssm.send(new GetParameterCommand({
			Name: this.parameterName
		}))

		const parameter = res.Parameter
		return parameter.Value
	}

}

export default Parameter
