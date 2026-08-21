/**
 * Creates the Google Form and linked response spreadsheet for merch orders.
 *
 * Run createMerchOrderForm() once at https://script.google.com. After granting
 * permission, copy the published form URL from the execution log. If this is
 * replacing the current form, update the order link in merch/index.html.
 */
function createMerchOrderForm() {
  const form = FormApp.create("Puru Tuladhar Store — Order Request");

  form
    .setDescription(
      "Ordering and delivery are currently available within Nepal only. We do not offer international shipping at this time. Before submitting, please review the product details, pricing, and size guide at https://purutuladhar.com/merch/. We will contact you on your Nepal mobile number to confirm availability, payment, and delivery.",
    )
    .setConfirmationMessage(
      "Thank you! Your order request has been received. We will contact you on the phone number provided to confirm availability, payment, and delivery.",
    )
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(true);

  form.addTextItem().setTitle("Full name").setRequired(true);

  const phoneValidation = FormApp.createTextValidation()
    .requireTextMatchesPattern("^(?:\\+977[- ]?)?9[0-9]{9}$")
    .setHelpText("Enter a valid 10-digit Nepal mobile number, for example 98XXXXXXXX. You may optionally include +977.")
    .build();

  form
    .addTextItem()
    .setTitle("Nepal mobile number")
    .setHelpText("Nepal numbers only, for example 98XXXXXXXX or +97798XXXXXXXX.")
    .setValidation(phoneValidation)
    .setRequired(true);

  form
    .addListItem()
    .setTitle("Product")
    .setChoiceValues(["Omarchy T-shirt — NPR 2,500"])
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("Choose your size")
    .setHelpText(
      "See the size chart before ordering: https://purutuladhar.com/merch/#size-chart",
    );

  form
    .addListItem()
    .setTitle("Size")
    .setChoiceValues(["XS", "S", "M", "L", "XL", "2XL"])
    .setRequired(true);

  form
    .addListItem()
    .setTitle("Quantity")
    .setChoiceValues(["1", "2", "3", "4", "5"])
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle("Delivery availability")
    .setChoiceValues([
      "I understand that delivery is currently available within Nepal only.",
    ])
    .setRequired(true);

  const responseSheet = SpreadsheetApp.create("Puru Tuladhar Merch Orders");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, responseSheet.getId());

  console.log("Published form URL: " + form.getPublishedUrl());
  console.log("Edit form URL: " + form.getEditUrl());
  console.log("Responses spreadsheet: " + responseSheet.getUrl());
}
