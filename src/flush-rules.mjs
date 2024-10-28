import SecurityGroup from './lib/securityGroup.mjs'

/**
 * Lambda handler
 * 
 * @param {object} event
 */
export async function handler(event) {
	console.log('event', JSON.stringify(event))

	// Setup security group, port and protocol
	const securityGroup = new SecurityGroup(process.env.SECURITY_GROUP_ID)
	securityGroup.setIngressConfig(process.env.INGRESS_PORT, process.env.INGRESS_PROTOCOL, process.env.RULE_DESCRIPTION)

	// Get current ips
	const whitelistedIps = await securityGroup.listCurrentIpRules()

	// Skip if there are no rules
	if (whitelistedIps.length === 0) {
		console.log('no ip rules to flush')
		return
	}

	// Flush ips list
	whitelistedIps.forEach(whitelistedIp => {
		console.log(`going to remove IP ${whitelistedIp} from security group access`)
	})
	await securityGroup.revokeIPs(whitelistedIps)

	// Return success response
	console.log(`flushed ${whitelistedIps.length} rules`)
}
