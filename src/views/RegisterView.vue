<template>
    <!-- Design can be changed later -->
    <div class="container mt-4">
        <form class="needs-validation" novalidate method="post"
            action="http://mercury.swin.edu.au/it000000/formtest.php" onsubmit="validateForm(event)"> 
            <!-- should be changed to the actual endpoint when ready -->

            <h2>Job Application</h2>

            <h5 class="mt-3">Personal Information</h5>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>First Name:</label>
                    <input type="text" class="form-control" name="Fname" pattern="[A-Za-z]+" required>
                    <div class="invalid-feedback">
                        First name is required and must contain letters only.
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <label>Last Name:</label>
                    <input type="text" class="form-control" name="Lname" pattern="[A-Za-z]+" required>
                    <div class="invalid-feedback">
                        Last name is required and must contain letters only.
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Date of Birth:</label>
                    <input type="date" id="DOB" class="form-control" name="DOB" required>
                    <div class="invalid-feedback">
                        Date of birth is required and must be valid.
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Mobile Number:</label>
                    <input type="text" class="form-control" name="phonenumber" pattern="\d{10}" required>
                    <div class="invalid-feedback">
                        Please enter a valid 10-digit mobile number.
                    </div>
                </div>
            </div>

            
            <h5 class="mt-3">Account Details</h5>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>Username:</label>
                    <input type="text" class="form-control" name="username" minlength="3" required>
                    <div class="invalid-feedback">
                        Username is required and must be at least 3 characters long.
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <label>Email:</label>
                    <input type="email" class="form-control" name="email" required>
                    <div class="invalid-feedback">
                        Please enter a valid email address.
                    </div>
                </div>

            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>Password:</label>
                    <input type="password" class="form-control" id="password" name="password"
                        pattern="^(?=.*[^A-Za-z0-9]).{8,}$" required>
                    <div class="invalid-feedback">
                        Password is required, must be at least 8 characters long, and contain at least one special
                        character.
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <label>Confirm Password:</label>
                    <input type="password" id="confirm_password" class="form-control" required>
                    <div class="invalid-feedback" id="confirmPasswordFeedback">
                        Invalid.
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3"> <!-- may be optional / removed if unnecessary -->
                <label>Preferred Movie Category:</label>
                <select class="form-select" name="category" required>
                    <option value="">Please select</option>
                    <option>Romance</option>
                    <option>Action</option>
                    <option>Comedy</option>
                    <option>Horror</option>
                    <option>Science Fiction</option>
                    <option>Other</option>
                </select>
                <div class="invalid-feedback">
                    Please select a movie category.
                </div>
            </div>

            <button type="button" class="btn btn-secondary" onclick="toggleTerms()">
                Terms and Conditions
            </button>

            <button type="submit" class="btn btn-primary">Submit</button>

            <div id="termsText" class="mt-3" style="display:none;">
                <p>Placeholder terms and conditions...</p>
            </div>

        </form>
    </div>
    <script>
        function toggleTerms() {
    let terms = document.getElementById("termsText");

    if (terms.style.display === "none") {
        terms.style.display = "block";
    } else {
        terms.style.display = "none";
    }
}

function validateForm(event) {
    let form = event.target;

    let password = document.getElementById("password");
    let confirmPassword = document.getElementById("confirm_password");
    let dob = document.getElementById("DOB");

    confirmPassword.setCustomValidity("");
    dob.setCustomValidity("");

    if (confirmPassword.value === "") {
        confirmPassword.setCustomValidity("Please confirm your password");
    } else if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity("Passwords do not match");
    }

    if (dob.value === "") {
        dob.setCustomValidity("Please enter your date of birth");
    } else {
        let birthDate = new Date(dob.value);
        let today = new Date();

        if (birthDate > today) {
            dob.setCustomValidity("Date of birth is invalid");
        } //else {
            //let age = today.getFullYear() - birthDate.getFullYear();
            //let monthDiff = today.getMonth() - birthDate.getMonth();
            //let dayDiff = today.getDate() - birthDate.getDate();

            //if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
              //  age--;
            //}

            //if (age < 18) {
              //  dob.setCustomValidity("You must be at least 18 years old to apply");
            //}
            //to be decided if we want to add an age restriction, 
            // if so, change the age limit as needed
        //}
    }

    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        form.reportValidity();
    }

    form.classList.add("was-validated");
}
    </script>
</template>