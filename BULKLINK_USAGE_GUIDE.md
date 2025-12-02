# BulkLink Template System - User Guide

## Quick Start

### 1. Create Your First Template

1. Go to **Dashboard** → **URL Shortener** → **Bulk Links**
2. Click the **Templates** tab
3. Click **Create Template** button
4. Follow the 7-step wizard:

#### Step 1: Template Information
- **Template Name**: e.g., "Summer Campaign 2024"
- **Description**: Optional description
- **Fallback URL Pattern**: `{destination}` (or customize like `{destination}/promo`)

#### Step 2: Routing Rules (Optional)
Add conditional routing rules:

**Example Rule 1:**
- Target URL Pattern: `{destination}/us`
- Condition Type: Country
- Countries: US, CA
- Priority: 10

**Example Rule 2:**
- Target URL Pattern: `{destination}/mobile`
- Condition Type: Device Type
- Devices: Mobile
- Priority: 20

#### Step 3-7: Configure Settings
- Collections, Visibility, Security, Domain, Tracking

5. Click **Create Template**

---

### 2. Create a Campaign from Template

1. Go to **Campaigns** tab
2. Click **Create Campaign**
3. Follow the 4-step wizard:

#### Step 1: Select Template
Choose from your existing templates

#### Step 2: Campaign Information
- **Campaign Name**: e.g., "Product Launch Q3"
- **Description**: Optional

#### Step 3: Add Links

**Option A - Manual Entry:**
Add links one by one with URL, title, description

**Option B - CSV Upload:**
Upload a CSV file with format:
```csv
url,title,description
https://shop.com/product-1,Product 1,Description 1
https://shop.com/product-2,Product 2,Description 2
```

[Download sample CSV](/samples/bulk-links-sample.csv)

#### Step 4: Review & Create
Review summary and create

4. Click **Create Campaign**

---

## Understanding Placeholders

Placeholders are replaced when creating SmartLinks:

### Available Placeholders:
- `{destination}` - Replaced with actual destination URL
- `{shortCode}` - Replaced with generated short code

### Examples:

**Template Rule:**
```
Target URL Pattern: {destination}/us?ref={shortCode}
```

**Campaign Link:**
```
Destination: https://shop.com/laptop-pro
Generated Short Code: abc123
```

**Result for US visitors:**
```
https://shop.com/laptop-pro/us?ref=abc123
```

**Result for other visitors (fallback):**
```
https://shop.com/laptop-pro
```

---

## Updating Templates

### Manual Update & Apply

1. Edit template (make changes to rules, settings)
2. Save template
3. On template detail page, click **Apply to Campaigns**
4. Choose:
   - **All campaigns**: Updates all SmartLinks from all campaigns
   - **Specific campaign**: Updates only selected campaign
5. Confirm and apply

**Warning:** This will update all existing SmartLinks. Make sure you want to apply changes.

---

## Managing Campaigns

### View Campaign Details

1. Go to **Campaigns** tab
2. Click on a campaign row
3. See:
   - Campaign stats (total links, clicks)
   - Template used
   - List of all SmartLinks

### Delete Campaign

**Option 1: Delete Campaign Only**
- Campaign is deleted
- SmartLinks remain active
- SmartLinks lose campaign association

**Option 2: Delete Campaign + SmartLinks**
- Campaign is deleted
- All SmartLinks are deleted
- Analytics data is preserved

---

## Best Practices

### Template Naming
Use descriptive names with date/version:
- ✅ "Summer Sale 2024 - Geo Targeting"
- ✅ "Affiliate Program v2 - Device Split"
- ❌ "Template 1"
- ❌ "Test"

### Fallback Pattern
Always provide a sensible fallback:
- ✅ `{destination}` - Safe default
- ✅ `{destination}?source=campaign` - Adds tracking
- ❌ Empty - Will fail for unmatched visitors

### Rule Priority
Lower number = higher priority:
- Priority 10: Most specific (e.g., US + Mobile)
- Priority 20: Less specific (e.g., US)
- Priority 30: Broad (e.g., Mobile)

### CSV Format
Required column: `url`
Optional columns: `title`, `description`

Supported variations:
- `url`, `link`, `destination`
- `title`, `name`
- `description`, `desc`

---

## Troubleshooting

### CSV Upload Fails
**Problem:** "No valid URLs found in CSV"

**Solutions:**
1. Check first row has column headers
2. Ensure URLs include protocol (http:// or https://)
3. Download sample CSV and compare format

### Template Can't Be Deleted
**Problem:** "Cannot delete template. It is used by 5 campaigns"

**Solution:**
1. Delete all campaigns first
2. OR keep template for future use

### Campaign Created with Partial Errors
**Problem:** "Created 95/100 links. 5 errors occurred"

**Solution:**
1. View campaign details
2. Check error messages
3. Manually fix failed items
4. Or accept 95 links and continue

---

## CSV Limits

- **Max links per campaign**: 100 (to prevent timeout)
- **Max file size**: 5 MB
- **Supported formats**: .csv only

For larger campaigns:
1. Split CSV into multiple files
2. Create multiple campaigns
3. OR increase limit in code (advanced)

---

## Support

For issues or questions:
1. Check migration was successful: See `README_BULKLINK_MIGRATION.md`
2. Check API is running
3. Check browser console for errors
4. Contact support with campaign ID

---

Happy bulk linking! 🚀



