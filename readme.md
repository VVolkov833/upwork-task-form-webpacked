Please implement the form with several fields defined below. All fields must have client side validation as described. Validation must be performed during submission.

User name
Type: simple text input
Validations: Not empty, min 3 chars

Country
Type: Text Input with auto completion.
Validation: Check that country is valid aka exists in predefined list. (No need to fill list with all countries, reasonable amount 10 - 20 will be enough)

Tax identifier
Type: Text fields with forced format.
Format is depending on selected country:
For USA it must be [4 digits]-[3 letters]-[5 or 7 digits]
For Canada it must be [10 symbols digits or letters A,B or D]-[2 letters]
Validation: Input must conform to format.

Validation messages should be shown below related inputs.

Submission of form should be done via AJAX (using fetch). In case of non 200 status codes show error message. In case of success show any «success message» and clear all form fields.

For the server side you could use any implementation you like just to check non success cases.

Please code this form with extensibility in mind. The more easily new/extra validations and fields could be added to this form the better.

You could either use pure Vue (without extra packages) or pure JavaScript (without extra packages).
For styles please use bootstrap or any other “rapid” CSS framework.
