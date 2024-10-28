const SecurityGroup = require('./lib/securityGroup')
const Parameter = require('./lib/parameter.mjs').default

/**
 * Lambda handler
 * 
 * @param {object} event
 */
exports.handler = async (event) => {
	console.log('event', JSON.stringify(event))

	// Get token from SSM parameter
	const tokenParameter = new Parameter(process.env.TOKEN_PARAMETER)
	const token = await tokenParameter.getValue()

	// Check token
	if (!event.pathParameters.token || event.pathParameters.token.toString().trim() !== token) {
		console.error('Token supplied is not valid or missing')
		// Return unauthorized response
		return {
			statusCode: 401,
			body: 'Token supplied is not valid or missing',
			headers: {
				'Content-Type': 'text/html',
			}
		}
	}
	console.log('token supplied is valid')

	// Get current source ip
	const sourceIp = event.requestContext.identity.sourceIp
	if (!sourceIp) {
		console.error('cannot find sourceIp from request context: ' + JSON.stringify(event.requestContext))
		// Return unauthorized response
		return {
			statusCode: 500,
			body: 'Cannot identify source IP',
			headers: {
				'Content-Type': 'text/html',
			}
		}
	}
	console.log('source ip found', sourceIp)

	// Setup security group, port and protocol
	const securityGroup = new SecurityGroup(process.env.SECURITY_GROUP_ID)
	securityGroup.setIngressConfig(process.env.INGRESS_PORT, process.env.INGRESS_PROTOCOL, process.env.RULE_DESCRIPTION)

	// Allow source ip to security group
	try {
		await securityGroup.authorizeIP(sourceIp)
	} catch (err) {
		if (err.code == 'InvalidPermission.Duplicate') {
			console.error('found duplicate IP whitelist request')

			// Return invalid request
			return {
				statusCode: 409,
				body: 'IP ' + sourceIp + ' already allowed for port ' + process.env.INGRESS_PORT,
				headers: {
					'Content-Type': 'text/html',
				}
			}
		}

		// Return server error
		console.error(err)
		return {
			statusCode: 500,
			body: 'An error occurred during IP whitelist operation',
			headers: {
				'Content-Type': 'text/html',
			}
		}
	}

	// Return success response
	console.log(`IP ${sourceIp} successfully allowed for port ${process.env.INGRESS_PORT}`)
	return {
		statusCode: 200,
		body: `IP ${sourceIp} allowed for port ${process.env.INGRESS_PORT}`,
		headers: {
			'Content-Type': 'text/html',
		}
	}
}
