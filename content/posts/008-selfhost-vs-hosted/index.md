+++
date = '2024-11-22T00:04:22+00:00'
slug = 'selfhost-vs-hosted-saas'
title = 'Should you self-host open-source services or pay for hosted versions ?'
description = 'There are both benefits and risks to each approach that you should take in consideration when you make a choice like this.'
featured_image = 'DALL·E-hosted-services-cloud-illustration.webp'
images = ['DALL·E-hosted-services-cloud-illustration.webp']
tags = ['startup', 'saas', 'selfhost']
categories = 'Startup'
+++

I was watching this video on using a paid hosted version of an open-source software instead of self-hosting it:

{{< youtube id="TkysPcpK0aQ" >}}

There are both benefits and risks to each approach that you should take in consideration when you make a choice like this.

This also depends on how this service affects your business:

**A.** If this service is **critical to your business**: (like for example the in browser IDE that the above video mentions for his e-learning platform)
- you should **self host** if possible.
- you should **know** the ins and outs of. Gain as much knowledge as you can.
- you should **spend as much time as needed** for this integration to be **frictionless and perfect**.

**Arguments**:
- This is the **core** of your business ! It should be the feature that **differentiates** you from any other competitor.
- If something goes wrong and you have to change this service, there will be a **very high impact** on your customers. Maybe you can't find a good enough alternative, or one with the same features/customizations. The vendor lock-in here has a high impact.
- You are free to change/improove any of the features of said service given enough dev time and a permissive code license.

**B.** If the service is **not** critical: (like your support ticket system, chat support, invoicing system, payment provider, knowledge base, blog, license management, etc)
- you should use a hosted version / Software As A Service / external solution.
- you should spend as little time as needed.

**Arguments**:
- It it not the core of your business, it does not matter that much.
- If something goes wrong and you have to change this service there will be very little impact on your customers. Many of them won't even notice. If you can't find an alternative with the same features, it doesn't matter that much.

## The **risks** involved for hosted versions / SaaS

I want to present to you some scenarios in which the hosted version can affect your startup:

1. The external company can go bankrupt and you have to migrate off it as quick as possible.
<br/>You don't know their financial situation.

2. The external company can focus on a new product and deprecate / stop support for your version.
<br/>You don't know their roadmap.

3. When you evolve and want to add/improve a feature you are limited to the customization provider and the external prover's willingness to work with you to change something for you. 
<br/>This can change over time as you grow or your external provider grows.

3. The external company can shift its focus on enterprise and increase prices overnight by 100x.
<br/>You don't know their leadership.
<br/>For example this [120k$ forced bill from CloudFlare](https://robindev.substack.com/p/cloudflare-took-down-our-website) ([ThePrimeagen video here](https://www.youtube.com/watch?v=8zj7ei5Egk8))

4. The external company can get hacked and your customers data can be leaked. Even if the external service does not host any of your customers data, if they get hacked, the bad actor can modify the service to steal customers data without you taking any action (like upgrading a npm dependency like in the case of a supply chain attack).
<br/>You don't know the security measures that all your external services apply to their business.

5. When the external provider of one of your **CORE** features has an outage, you have an outage that you can't do anything about.

## The benefits of **Self-Hosting** !

1. When you need a feature/customization that is not supported by your external solution: you just fork it and invest dev time into it. (If the license supports it)

2. When something breaks, code regression: you have the power to rollback. You don't have to wait for the external provider to fix it.

3. When you have an outage because of a bad config: you have the power to fix it and change your deployment procedure to never happen again.

4. When you have an outage because of your hosting provider: you can change your hosting.

## Conclusion

My point is that the CORE features of your business should be as close to your control as possible.
Too many external dependencies increase your overall risk because companies are not your buddies from high school, companies evolve, companies change, companies get bought out, companies get hacked, and so on.

For your startup the risks are worth the time saved ?
<br/>At the stage you are at ?
<br/>What about at a later stage ?

