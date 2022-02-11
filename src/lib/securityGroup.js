const EC2 = require('aws-sdk/clients/ec2')
const ec2 = new EC2({
	logger: console,
	apiVersion: '2016-11-15'
})

class SecurityGroup {
	/**
   * SecurityGroup constructor
   * 
   * @param {string} securityGroupId
   */
	constructor(securityGroupId) {
		this.securityGroupId = securityGroupId
	}

	/**
	 * Set ingress config
	 * 
   * @param {string} port
   * @param {string} protocol
   * @param {string} ruleDescription
	 */
	setIngressConfig(port, protocol, ruleDescription) {
		this.protocol = protocol
		this.ruleDescription = ruleDescription

		if (port.includes('-')) {
			const portParts = port.split('-')
			this.fromPort = portParts[0]
			this.toPort = portParts[1]
		} else {
			this.fromPort = port
			this.toPort = port
		}
	}
  
	/**
   * Authorize IP as ingress
   * 
   * @param {string} sourceIp
   */
	async authorizeIP(sourceIp) {
		await ec2.authorizeSecurityGroupIngress({
			GroupId: this.securityGroupId,
			IpPermissions: [{
				IpProtocol: this.protocol,
				FromPort: this.fromPort,
				ToPort: this.toPort,
				IpRanges: [{
					CidrIp: sourceIp + '/32',
					Description: this.ruleDescription
				}]
			}]
		}).promise()
	}

	/**
   * Revoke IPs ingress
   * 
   * @param {string[]} sourceIps
   */
	async revokeIPs(sourceIps) {
		await ec2.revokeSecurityGroupIngress({
			GroupId: this.securityGroupId,
			IpPermissions: [{
				IpProtocol: this.protocol,
				FromPort: this.fromPort,
				ToPort: this.toPort,
				IpRanges: sourceIps.map(sourceIp => ({
					CidrIp: sourceIp
				}))
			}]
		}).promise()
	}

	/**
   * List current IP rules
   */
	async listCurrentIpRules() {
		const res = await ec2.describeSecurityGroups({
			GroupIds: [this.securityGroupId]
		}).promise()

		if(res.SecurityGroups.length == 0){
			console.error(`security group ${this.securityGroupId} not found`)
			return []
		}

		const securityGroup = res.SecurityGroups[0]
		console.log(`security group ${securityGroup.GroupId} found`)

		const ipPermissionsFiltered = []
		const ipPermissions = res.SecurityGroups[0].IpPermissions
		ipPermissions.forEach((ipPermission) => {
			if (ipPermission.FromPort !== parseInt(this.fromPort)) {
				console.log(`IP permission skipped, from port ${ipPermission.FromPort} does not match ${this.fromPort}`)
				return
			}
			if (ipPermission.ToPort !== parseInt(this.toPort)) {
				console.log(`IP permission skipped, to port ${ipPermission.ToPort} does not match ${this.toPort}`)
				return
			}

			ipPermission.IpRanges.forEach((ipRange) => {
				// Check if rule has the right description
				if(ipRange.Description === this.ruleDescription){
					ipPermissionsFiltered.push(ipRange.CidrIp)
					console.log(`found IP range ${ipRange.CidrIp}`)
				} else {
					console.log(`IP range ${ipRange.CidrIp} skipped, description "${ipRange.Description}" does not match "${this.ruleDescription}"`)
				}
			})
		})

		return ipPermissionsFiltered
	}

}

module.exports = SecurityGroup
