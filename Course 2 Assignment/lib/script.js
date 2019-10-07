/**
 * New script file
 */
/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getFactory emit */

/**
 * Create a new property
 * @param {org.property.registration.createProperty} tx
 * @transaction
 
 */
 
async function createProperty(tx){
	console.log('Property Creation Transaction');
	const factory = getFactory();
	const NS = 'org.property.registration';
	const me = getCurrentParticipant();
	
	//Add new property
	const property = factory.newResource(NS, 'Property', tx.PID);
	property.marketPrice = tx.marketPrice;
	property.regDate = tx.regDate;
	property.propertyType = tx.propertyType;
	property.location = tx.location;
	property.owner = me;
	
	// save the property
	const registry = await getAssetRegistry(property.getFullyQualifiedType());
	await registry.add(property);
}

/**
 * Create an intent for Sale 
 * @param {org.property.registration.intentForSale} tl
 * @transaction
 
 */
async function intentForSale(tl){
    console.log('Property Listing for Sale Intent Transaction');
	const factory = getFactory();
	const NS = 'org.property.registration';
   
	const propertylisting = factory.newResource(NS, 'PropertyListing', tl.PLID);
 	
  // update the property status with "intent for sale"  
    const propertyRegistry = await getAssetRegistry('org.property.registration.Property');
  
  const prop = await propertyregistry.get(tl.property.PID);
    if (prop) {
    prop.status = "intent for Sale";
      await propertyregistry.update(prop);
      
    }else {
    throw new Error ('Property with this id does not exist');
    }	
  // save the listing
  	const propListingRegistry = await getAssetRegistry(propertylisting.getFullyQualifiedType());
  	propertylisting.property=prop;
	await propListingRegistry.add(propertylisting);
	
}

/**
 * Create a purchase Property 
 * @param {org.property.registration.purchaseProperty} tx
 * @transaction
 
 */
async function purchaseProperty(tx){
    console.log('Property Purchase Transaction');
	const factory = getFactory();
	const NS = 'org.property.registration';
	const me = getCurrentParticipant(); // buyer

    const userRegistry = await getParticipantRegistry('org.property.registration.User');
    const propListingRegistry = await getAssetRegistry('org.property.registration.PropertyListing');
    const propertyRegistry = await getAssetRegistry('org.property.registration.Property');
    
    const propListing = await propListingRegistry.get(tx.listing.PLID);
    const property = await propertyRegistry.get(tx.listing.property.PID);
    
    const buyer = await userRegistry.get(me.userId);
    const seller = await userRegistry.get(tx.listing.property.owner.userId);
    
    const sellingPrice = property.marketPrice;
    if (buyer.balance >= sellingPrice) {
      property.status = "Registered"
      property.owner = me;
      await propertyRegistry.update(property);
      buyer.balance = buyer.balance - sellingPrice;
      seller.balance = seller.balance + sellingPrice;
      await userRegistry.update(buyer);
      await userRegistry.update(seller);
    } else {
    throw new Error(' Insufficient funds in buyer account');
    }
  await propListingRegistry.remove(propListing);
}