const SSM = require('aws-sdk/clients/ssm')
const ssm = new SSM()

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
   * @returns {string}
   */
	async getValue() {
		const res = await ssm.getParameter({
			Name: this.parameterName
		}).promise()

		const parameter = res.Parameter
		return parameter.Value
	}

}

module.exports = Parameter
