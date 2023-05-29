import { Button, Center, Container, List, Paper, Text, Title } from '@mantine/core';
import { FooterLinks } from '~/components/footer';

export default function TOS() {
	return (
		<>
			<Container m="lg">
				<Title order={1}>Terms of Service</Title>
				<Button component="a" href="/" mt="md">
					Go Back
				</Button>
				<Title order={3} mt="sm">
					Agreement to Terms
				</Title>
				<Text ml="lg">
					These Terms of Use ("Terms") constitute a legally binding agreement between you, whether personally or on behalf of any entity ("you") and Auro ("we",
					"us", or "our"), concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application
					related, linked, or otherwise connected thereto (collectively, "the Site"). You agree that by accessing the Site, you have read, understood, and
					agreed to be bound by all of these Terms. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND MUST
					DISCONTINUE USE IMMEDIATELY.
				</Text>
				<Title order={3}>Introduction</Title>
				<Text ml="lg">
					OuraBot is a "Service" by us that allows users to utilize a chatbot on the Twitch (http://twitch.tv) platform. OuraBot and we are not affiliated with
					Twitch in any way.
				</Text>
				<Title order={3}>User Terms</Title>
				<Text ml="lg">
					By agreeing to these Terms, you acknowledge and agree to use OuraBot in compliance with all applicable laws, regulations, and Twitch’s terms of
					service. You also agree that you are at least 18 years old or older. You also agree that you will not use OuraBot for any of the following purposes:
					<List type="ordered" withPadding>
						<List.Item>To use OuraBot for any illegal purpose.</List.Item>
						<List.Item>To attempt to disrupt, interfere with, or harm OuraBot's functionality or any user’s use of the Site.</List.Item>
						<List.Item>To use OuraBot to engage in any form of harassment, discriminatory behavior or hate speech.</List.Item>
						<List.Item>To reverse-engineer, decompile, or disassemble any part of OuraBot.</List.Item>
						<List.Item>To use OuraBot to promote or transmit any worms, viruses, or other malicious code.</List.Item>
						<List.Item>To use OuraBot to trick, defraud, or mislead us or any other users of the Site.</List.Item>
						<List.Item>To circumvent, disable, or otherwise interfere with security-related features of the Site.</List.Item>
						<List.Item>
							To systematically retrieve data or other content from the Site to a compiled database or directory without written permission from us.
						</List.Item>
						<List.Item>To falsely imply a relationship with us.</List.Item>
					</List>
				</Text>
				<Title order={3}>General Conditions</Title>
				<Text ml="lg">
					We reserve the right to refuse service to anyone for any reason at any time. We may also modify OuraBot or these Terms at any time without prior
					notice. You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of OuraBot without our express written permission. The
					headings used in these Terms are included for convenience only and will not limit or otherwise affect these Terms.
				</Text>
				<Title order={3}>Accuracy of Information</Title>
				<Text ml="lg">
					We are not responsible if the information made available on this site is not accurate, complete, or current. The material on this site is provided for
					general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, or
					more complete sources of information.
				</Text>
				<Title order={3}>Modifications to the Service and Prices</Title>
				<Text ml="lg">
					Prices and/or fees for our Service are subject to change at any time without notice. We reserve the right to modify or discontinue our Service (or any
					part of the content thereof) without notice at any time. We may, at our sole discretion and without liability to you, modify, discontinue, or suspend
					all or any portion of our Site, including any paid features, at any time with or without notice to you. You agree that we shall not be liable to you
					or any third party for any modification, discontinuance or suspension of our site or any paid features. In the event that we discontinue any paid
					features, you acknowledge and agree that you will not be entitled to a refund for any fees paid for such features.
				</Text>
				<Title order={3}>Accuracy of Billing and Account Information</Title>
				<Text ml="lg">You agree to provide current, complete, and accurate billing and account information for OuraBot.</Text>
				<Title order={3}>Taxes</Title>
				<Text ml="lg">
					Any Service fees collected may be subject to sales tax or value-added tax (VAT). Any applicable tax is applied on top of the Service fees collected
					and is shown before payment completion.
				</Text>
				<Title order={3}>Optional Tools</Title>
				<Text ml="lg">
					We may provide you with access to third-party tools that we neither monitor nor have any control over. You acknowledge and agree that we provide
					access to such tools ”as is” and “as available” without any warranties, representations or conditions of any kind and without any endorsement. We
					shall have no liability whatsoever arising from or relating to your use of optional third-party tools. Any use by you of optional tools offered
					through the site is entirely at your own risk and discretion and you should ensure that you are familiar with and approve of the terms on which tools
					are provided by the relevant third-party provider(s). We may also, in the future, offer new services and/or features through the website (including,
					the release of new tools and resources). Such new features and/or services shall also be subject to these Terms of Service.
				</Text>
				<Title order={3}>Third-Party Links</Title>
				<Text ml="lg">
					OuraBot may contain links to third-party websites or services that are not owned or controlled by us. We do not have any control over, and therefore
					cannot assume any responsibility for, the content, privacy policies or practices of any third-party websites or services. Complaints, claims,
					concerns, or questions regarding third-party products should be directed to the third party.
				</Text>
				<Title order={3}>Personal Information</Title>
				<Text ml="lg">Your submission of personal information through the service is governed by our Privacy Policy.</Text>
				<Title order={3}>Errors, Inaccuracies, and Omissions</Title>
				<Text ml="lg">
					There may be errors, inaccuracies, or omissions in the content and information provided through OuraBot. We reserve the right to correct any errors,
					inaccuracies, or omissions, and to change or update information or cancel orders if any information in the Service or on any related website is
					inaccurate at any time without prior notice (including after you have submitted your order). We undertake no obligation to update, amend or clarify
					information in the service or on any related website, including without limitation, pricing information, except as required by law. No specified
					update ore fresh date applied in the service or on any related website should be taken to indicate that all information in the Service or on any
					related website has been modified or updated.
				</Text>
				<Title order={3}>Disclaimer of Warranties; Limitation of Liability</Title>
				<Text ml="lg">
					We do not guarantee, represent or warrant that your use of our service will be uninterrupted, timely, secure or error-free. We do not warrant that the
					results that may be obtained from the use of the service will be accurate or reliable. You agree that from time to time we may remove the service for
					indefinite periods of time or cancel the service at any time, without notice to you. You expressly agree that your use of, or inability to use, the
					service is at your sole risk. The service and all products and services delivered to you through the service are (except as expressly stated by us)
					provided 'as is' and 'as available' for your use, without any representation, warranties or conditions of any kind, either express or implied,
					including all implied warranties or conditions of merchantability, merchantable quality, fitness for a particular purpose, durability, title, and
					non-infringement. In no case shall Auro, or other affiliated individuals or entities, be liable for any injury, loss, claim, or any direct, indirect,
					incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of
					data, replacement costs, or any similar damages, whether based in contract, tort (including negligence), strict liability or otherwise, arising from
					your use of any of the service or any products procured using the service, or for any other claim related in any way to your use of the service or any
					product, including, but not limited to, any errors or omissions in any content, or any loss or damage of any kind incurred as a result of the use of
					the service or any content (or product) posted, transmitted, or otherwise made available via the service, even if advised of their possibility.
					Because some states or jurisdictions do not allow the exclusion or the limitation of liability for consequential or incidental damages, in such states
					or jurisdictions, our liability shall be limited to the maximum extent permitted by law.
				</Text>
				<Title order={3}>Indemnification</Title>
				<Text ml="lg">
					You agree to indemnify, defend and hold harmless Auro, and any affiliated individuals or entities, from any claim or demand, including reasonable
					attorneys' fees, arising out of your use of the OuraBot.
				</Text>
				<Title order={3}>Severability</Title>
				<Text ml="lg">
					In the event that any provision of these Terms of Service is determined to be unlawful, void or unenforceable, such provision shall nonetheless be
					enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these Terms of
					Service, such determination shall not affect the validity and enforceability of any other remaining provisions.
				</Text>
				<Title order={3}>Termination</Title>
				<Text ml="lg">
					The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement for all
					purposes. These Terms of Service are effective unless and until terminated by either you or us. You may terminate these Terms of Service at any time
					by notifying us that you no longer wish to use our Services, or when you cease using our site. If in our sole judgment, you fail, or we suspect that
					you have failed, to comply with any term or provision of these Terms of Service, we also may terminate this agreement at any time without notice and
					you will remain liable for all amounts due up to and including the date of termination; and/or accordingly may deny you access to our Services (or any
					part thereof).
				</Text>
				<Title order={3}>Entire Agreement</Title>
				<Text ml="lg">
					The failure of us to exercise or enforce any right or provision of these Terms of Service shall not constitute a waiver of such right or provision.
					These Terms of Service and any policies or operating rules posted by us on this site or in respect to The Service constitute the entire agreement and
					understanding between you and us and govern your use of the Service, superseding any prior or contemporaneous agreements, communications and
					proposals, whether oral or written, between you and us (including, but not limited to, any prior versions of the Terms of Service). Any ambiguities in
					the interpretation of these Terms of Service shall not be construed against the drafting party.
				</Text>
				<Title order={3}>Governing Law</Title>
				<Text ml="lg">
					These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of
					the state of Tennessee and the United States of America.
				</Text>
				<Title order={3}>Intellectual Property</Title>
				<Text ml="lg">
					All content and materials available on OuraBot, including but not limited to text, graphics, website name, code, images, and logos, are the
					intellectual property of Auro or its licensors and protected by applicable intellectual property laws. Any unauthorized use, reproduction, or
					distribution of OuraBot's content or materials is strictly prohibited and may result in legal action. You acknowledge and agree that you do not
					acquire any ownership rights in any intellectual property belonging to Auro or its licensors by using OuraBot or its services.
				</Text>
				<Title order={3}>Changes to Terms of Service</Title>
				<Text ml="lg">
					We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our
					website. Your continued use of or access to our website or the Service following the posting of any changes to these Terms of Service constitutes
					acceptance of those changes.
				</Text>
				<Title order={3}>Contact Information</Title>
				<Text ml="lg">If you have any questions about these Terms of Service or if you need to contact us, please email us at contact@ourabot.com</Text>
			</Container>
			<FooterLinks />
		</>
	);
}
