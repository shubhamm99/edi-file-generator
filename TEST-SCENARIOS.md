# EDI Tools Test Scenarios

This document contains comprehensive test scenarios for both the EDI Generator and EDI Visualizer tools.

## Test Scenarios for EDI Generator

### 1. Basic Valid 835 Generation
**Steps:**
1. Fill in minimal required fields (transaction settings, payer, provider, patient)
2. Add one claim with basic information
3. Generate EDI

**Expected Result:**
- ✅ Valid EDI 835 format message
- All required segments present (ISA, GS, ST, BPR, SE, GE, IEA)
- No validation errors

---

### 2. Multiple Claims
**Steps:**
1. Add 3-5 claims with different amounts
2. Each claim should have:
   - Unique claim number
   - Different charged/paid amounts
   - Patient responsibility

**Expected Result:**
- Each claim generates correct CLP segment
- Total payment in BPR matches sum of all claim payments
- Each claim properly enclosed with NM1 segments

---

### 3. Claims with Service Lines
**Steps:**
1. Add a claim
2. Add 3-5 service lines to the claim
3. Each service line has:
   - Procedure code (e.g., 99213, 99214)
   - Charge amount
   - Paid amount
   - Service date

**Expected Result:**
- Each service line generates SVC segment
- DTM segments for each service date
- REF segments for line item identification

---

### 4. Service Line Adjustments (CAS)
**Steps:**
1. Add a claim with service lines
2. Add multiple adjustments to each service line:
   - Group codes: CO, PR, OA
   - Reason codes: 45, 1, 2, 3
   - Various amounts

**Expected Result:**
- CAS segments generated for each adjustment
- Proper format: CAS*groupCode*reasonCode*amount
- Adjustments properly attributed to correct service lines

---

### 5. Claim Level Adjustments
**Steps:**
1. Add claim-level adjustments (not on service lines)
2. Mix of different adjustment types

**Expected Result:**
- CAS segments appear at claim level (after CLP, before SVC)
- Properly formatted

---

### 6. Provider Level Adjustments (PLB)
**Steps:**
1. Fill PLB section
2. Add multiple adjustments with:
   - Different adjustment codes (WO, FB, etc.)
   - Adjustment IDs
   - Various amounts

**Expected Result:**
- PLB segment generated at transaction level
- All adjustments included in one PLB segment
- Proper format with date and provider ID

---

### 7. Duplicate Functionality
**Steps:**
1. Create a claim with service lines and adjustments
2. Click "Duplicate Claim"
3. Modify the duplicated claim

**Expected Result:**
- Complete deep copy of claim including nested items
- Changes to duplicate don't affect original
- All service lines and adjustments copied

---

### 8. Duplicate Service Line
**Steps:**
1. Add service line with adjustments
2. Click "Duplicate Service Line"

**Expected Result:**
- Service line copied with all adjustments
- Independent from original

---

### 9. Reset Form
**Steps:**
1. Fill out complex form with multiple claims
2. Click Reset button

**Expected Result:**
- All fields cleared
- Form returns to initial state
- One empty claim remains
- Confirmation shows before reset

---

### 10. Collapsible Sections
**Steps:**
1. Expand/collapse each section:
   - Transaction Settings
   - Payer Info
   - Patient Info
   - Provider Info
   - Claims
   - Service Lines
   - Adjustments

**Expected Result:**
- Smooth transitions
- Icons change (+ to −)
- State persists while editing
- Keyboard accessible (Tab, Enter)

---

### 11. Empty/Minimal Data
**Steps:**
1. Leave most fields empty
2. Try to generate EDI

**Expected Result:**
- EDI still generates with default values
- No crashes or errors
- Validation may warn about missing optional data

---

### 12. Special Characters in Data
**Steps:**
1. Enter data with special characters:
   - Asterisks (*)
   - Tildes (~)
   - Colons (:)
   - Line breaks

**Expected Result:**
- EDI handles delimiter conflicts
- No malformed segments
- Validation catches issues

---

### 13. Very Large Amounts
**Steps:**
1. Enter large monetary amounts (e.g., $999,999.99)
2. Generate EDI

**Expected Result:**
- Amounts formatted correctly (2 decimal places)
- No overflow or formatting issues

---

### 14. Copy to Clipboard
**Steps:**
1. Generate valid EDI
2. Click "Copy to Clipboard"

**Expected Result:**
- Success message shows
- EDI content copied to clipboard
- Can paste into other applications

---

### 15. Validation Display
**Steps:**
1. Observe validation status after generation

**Expected Result:**
- Green badge for valid EDI
- Red error panel for invalid EDI
- Specific error messages listed

---

## Test Scenarios for EDI Visualizer

### 16. Valid 835 Sample Loading
**Steps:**
1. Click "Load Sample"
2. Click "Visualize EDI"

**Expected Result:**
- EDI parses successfully
- Payment summary displayed
- Claims section shows all claims
- Provider adjustments visible (if any)

---

### 17. Invalid Content - Random Text
**Steps:**
1. Paste random text: "asdfghjkl12345"
2. Click "Visualize EDI"

**Expected Result:**
- Validation fails with errors:
  - "Content does not appear to be EDI format - missing ISA segment"
  - "Could not detect segment terminator"
  - Additional specific errors

---

### 18. Invalid Content - Incomplete EDI
**Steps:**
1. Paste only: "ISA*00*"
2. Click "Visualize EDI"

**Expected Result:**
- Multiple validation errors:
  - Missing required segments
  - EDI must have at least 7 segments
  - Segment structure issues

---

### 19. Valid EDI Without Line Breaks
**Steps:**
1. Paste valid EDI on single line (no \n, just ~)
2. Click "Visualize EDI"

**Expected Result:**
- Parses successfully (line breaks optional)
- Summary displays correctly
- No false positive errors

---

### 20. EDI with Multiple Claims
**Steps:**
1. Paste EDI with 5+ claims
2. Visualize

**Expected Result:**
- All claims listed separately
- Each claim shows:
  - Claim number and ICN
  - Status badge (color-coded)
  - Amounts (charged, paid, patient resp)
  - Service date
  - Service lines
  - Adjustments
  - Remark codes

---

### 21. Payment Information Display
**Steps:**
1. Load valid EDI
2. Check payment section

**Expected Result:**
- Check amount highlighted (green)
- Check number displayed (blue)
- Check date formatted (purple)
- Payer name
- Provider name

---

### 22. Service Line Details
**Steps:**
1. Load EDI with multiple service lines
2. Check each claim

**Expected Result:**
- Each service line shows:
  - Procedure code (e.g., 99213)
  - Charged amount
  - Paid amount
  - Service-level adjustments (if any)

---

### 23. Adjustment Details
**Steps:**
1. Load EDI with CAS segments
2. Check adjustments display

**Expected Result:**
- Claim-level adjustments in red box
- Format: "GroupCode-ReasonCode: -$amount"
- Service-level adjustments under each service
- Quantities shown if present

---

### 24. Remark Codes
**Steps:**
1. Load EDI with REF*CAS segments
2. Check remark codes section

**Expected Result:**
- Remark codes displayed in yellow badges
- All codes from REF segments captured

---

### 25. Provider Level Adjustments (PLB)
**Steps:**
1. Load EDI with PLB segment
2. Check PLB section

**Expected Result:**
- Separate orange section for PLB
- Shows:
  - Provider ID
  - Date
  - Reason code
  - Amount

---

### 26. Claim Status Color Coding
**Steps:**
1. Load EDI with different claim statuses

**Expected Result:**
- Status 1 (Processed as Primary): Green badge
- Status 2 (Processed as Secondary): Yellow badge
- Status 4 (Denied): Red badge

---

### 27. Toggle Raw Segments
**Steps:**
1. Visualize valid EDI
2. Click "Show Raw Segments"
3. Click "Hide Raw Segments"

**Expected Result:**
- Detailed segment table appears/disappears
- Shows segment ID, description, elements
- Elements displayed as badges

---

### 28. Raw Segment Details
**Steps:**
1. Show raw segments
2. Examine table

**Expected Result:**
- Each segment in separate row
- Segment ID (e.g., ISA, GS)
- Description (e.g., "Interchange Control Header")
- Elements as blue badges
- Empty elements not shown

---

### 29. Clear Functionality
**Steps:**
1. Load and visualize EDI
2. Click "Clear"

**Expected Result:**
- Input textarea cleared
- Results cleared
- Error messages cleared
- Returns to empty state

---

### 30. Empty State Display
**Steps:**
1. Load visualizer without input
2. Or clear after visualization

**Expected Result:**
- Eye icon displayed
- "No EDI content visualized yet" message
- Instructions to paste content

---

### 31. Validation Errors Display
**Steps:**
1. Enter invalid EDI
2. Check error display

**Expected Result:**
- Red border and background
- Warning icon
- Error header with count
- Bulleted list of specific errors

---

### 32. Long EDI Content
**Steps:**
1. Paste EDI with 50+ claims
2. Visualize

**Expected Result:**
- Handles large content without freezing
- Scrollable results
- All claims processed
- Performance acceptable

---

### 33. EDI with Special Segments
**Steps:**
1. Test with EDI containing:
   - NM1 (various entity types)
   - N1, N3, N4 (address info)
   - DTM (multiple date types)
   - REF (various references)

**Expected Result:**
- All segments recognized
- Proper descriptions
- Data extracted correctly

---

### 34. Missing Optional Data
**Steps:**
1. Load EDI missing:
   - ICN
   - Service dates
   - Remark codes
   - PLB segments

**Expected Result:**
- Shows "N/A" for missing data
- No crashes
- Sections hide when empty (e.g., no PLB section if no PLB)

---

### 35. Mixed Delimiters
**Steps:**
1. Test with different delimiters:
   - Standard: * and ~
   - Alternative: | and ~

**Expected Result:**
- Auto-detects delimiters
- Parses correctly regardless
- No false errors

---

## UI/UX Test Scenarios

### 36. Responsive Layout
**Steps:**
1. Resize browser window
2. Test on different screen sizes

**Expected Result:**
- Generator: Side-by-side splits to stacked on mobile
- Visualizer: Side-by-side splits to stacked on mobile
- All buttons accessible
- Text readable

---

### 37. Tab Navigation
**Steps:**
1. Switch between Generator and Visualizer tabs

**Expected Result:**
- Smooth transition
- Active tab highlighted
- Each tool independent
- State preserved when switching

---

### 38. Keyboard Navigation
**Steps:**
1. Use Tab key to navigate
2. Use Enter/Space to activate buttons
3. Use Enter in form fields

**Expected Result:**
- All interactive elements accessible
- Logical tab order
- Focus indicators visible
- ARIA labels work with screen readers

---

### 39. Button States
**Steps:**
1. Test all button hover states
2. Test disabled states
3. Test focus states

**Expected Result:**
- Hover: Color darkens
- Disabled: Grayed out, not clickable
- Focus: Ring visible around button
- Smooth transitions

---

### 40. Loading States
**Steps:**
1. Trigger generation/visualization
2. Observe loading indicators

**Expected Result:**
- Spinner animation
- "Generating..." or "Parsing..." message
- UI disabled during loading
- Completes within 1 second

---

## Edge Cases & Error Handling

### 41. Extremely Long Field Values
**Steps:**
1. Enter 1000+ character strings in fields
2. Generate EDI

**Expected Result:**
- Handles gracefully
- May truncate with warning
- No crashes

---

### 42. Negative Amounts
**Steps:**
1. Enter negative values in amount fields
2. Generate/visualize

**Expected Result:**
- Accepts negative numbers
- Formats correctly (e.g., -$100.00)
- Common for adjustments

---

### 43. Zero Amounts
**Steps:**
1. Set all amounts to $0.00
2. Generate EDI

**Expected Result:**
- Accepts zero values
- Formats as "0.00"
- No division by zero errors

---

### 44. Date Validation
**Steps:**
1. Test various date formats
2. Invalid dates

**Expected Result:**
- Accepts standard formats
- Converts to YYYYMMDD
- Validates reasonable dates

---

### 45. Concurrent Operations
**Steps:**
1. Click "Generate" multiple times rapidly
2. Or "Visualize" multiple times

**Expected Result:**
- Loading state prevents double-clicks
- Operations don't conflict
- Results from latest operation shown

---

### 46. Browser Compatibility
**Test on:**
- Chrome
- Firefox
- Edge
- Safari

**Expected Result:**
- Consistent appearance
- All features work
- No console errors

---

### 47. Memory Management
**Steps:**
1. Generate/visualize 100+ times
2. Monitor browser memory

**Expected Result:**
- No memory leaks
- Performance stable
- Browser doesn't slow down

---

### 48. Copy/Paste Special
**Steps:**
1. Copy EDI from visualizer
2. Paste into generator
3. Copy from external source with formatting

**Expected Result:**
- Plain text pasted
- No extra formatting
- Special characters preserved

---

### 49. Form Validation
**Steps:**
1. Try submitting with invalid data
2. Check validation messages

**Expected Result:**
- Required fields marked
- Inline error messages
- Can't submit invalid form

---

### 50. Accessibility Audit
**Steps:**
1. Run Lighthouse audit
2. Test with screen reader
3. Check color contrast

**Expected Result:**
- Accessibility score 90+
- All images have alt text
- Proper heading hierarchy
- Sufficient color contrast

---

## Performance Benchmarks

### Target Metrics:
- **Generation Time**: < 500ms for typical EDI
- **Visualization Time**: < 500ms for typical EDI
- **UI Response**: < 100ms for interactions
- **File Size**: Generated EDI < 100KB typically
- **Memory**: < 50MB for application

---

## Automation Test Ideas

### Unit Tests Needed:
1. EDI generation service tests
2. EDI validation service tests
3. Segment parsing tests
4. Summary extraction tests
5. Date formatting tests
6. Amount formatting tests
7. Deep copy functionality tests

### Integration Tests Needed:
1. Form to EDI generation flow
2. EDI input to visualization flow
3. Tab switching with state preservation
4. Copy to clipboard functionality

### E2E Tests Needed:
1. Complete user journey: Generate → Copy → Visualize
2. Multi-claim workflow
3. Error recovery flows
4. Responsive design tests

---

## Sample Test Data

### Valid EDI 835 (Minimal):
```
ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*RECEIVERID     *241109*1200*U*00401*000000001*0*P*:~
GS*HP*PAYERID*RECEIVERID*20241109*1200*1*X*005010X221A1~
ST*835*0001*005010X221A1~
BPR*I*1000.00*C*ACH*CCP*01*000000000*DA*0000000000*PAYERID***01*000000000*DA*0000000000*20241109~
TRN*1*123456789012*1234567890~
N1*PR*INSURANCE COMPANY*XX*PAYERID~
N3*123 MAIN ST~
N4*ANYTOWN*ST*12345~
N1*PE*PROVIDER CLINIC*XX*1234567890~
N3*456 ELM ST~
N4*OTHERTOWN*ST*67890~
CLP*CLAIM001*1*1000.00*1000.00*0.00*MB*ICN123456789*11*1~
NM1*QC*1*PATIENT*JOHN****MI*PAT123~
NM1*82*2*PROVIDER CLINIC*****XX*1234567890~
SVC*HC:99213*1000.00*1000.00**1~
DTM*472*20241101~
SE*15*0001~
GE*1*1~
IEA*1*000000001~
```

### Invalid EDI Samples for Testing:
1. **Missing ISA**: `GS*HP*PAYERID...`
2. **Wrong segment order**: `BPR* ... ISA*...`
3. **Mismatched envelopes**: ISA without IEA
4. **Invalid segment IDs**: `XYZ*data*data~`
5. **Missing terminators**: `ISA*00*     GS*HP`
6. **Wrong delimiters**: `ISA|00|...|~` (mixed)

---

## Testing Checklist

### Before Release:
- [ ] All 50 scenarios tested
- [ ] No console errors
- [ ] Accessibility audit passed
- [ ] Browser compatibility verified
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] README reflects current features
- [ ] Sample EDI files provided
- [ ] Error messages are helpful
- [ ] Loading states work
- [ ] Responsive design tested
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## Known Limitations to Document:
1. Only supports 835 transaction type
2. Uses simplified ISA segment generation
3. Limited to ASCII characters
4. Assumes standard delimiters (* and ~)
5. No X12 syntax validation beyond structure

---

## Future Test Scenarios (Post-MVP):
- Import EDI from file
- Export to file
- Print functionality
- Compare two EDI files
- Edit EDI directly
- Syntax highlighting
- Search within EDI
- Filter claims/segments
- Export to CSV
- Batch processing

