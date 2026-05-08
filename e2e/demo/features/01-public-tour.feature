Feature: Public site tour

  Scenario: Visitor explores the STAIJA homepage and programs
    Given I am on the home page
    When I navigate to the StepUp Scholars page
    And I navigate to the Dynamerge page
    And I navigate to the About page
    And I navigate to the Get Involved page
    And I navigate to the Contact page
    Then the contact page should be visible
