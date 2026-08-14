import sys
import json
import datetime
from numbers_parser import Document

def clean_str(val):
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None

def parse_number(val):
    if val is None:
        return None
    try:
        # Remove commas, currency symbols, and spaces
        s = str(val).replace('₹', '').replace(',', '').replace(' ', '').strip()
        if not s:
            return None
        return float(s)
    except ValueError:
        return None

def normalize_division(val):
    """Normalize division strings by removing internal spaces (e.g. 'EDD -2' -> 'EDD-2')."""
    if val is None:
        return None
    # Remove spaces around hyphens: 'EDD -2' -> 'EDD-2', 'EUDD -5' -> 'EUDD-5'
    import re
    return re.sub(r'\s*-\s*', '-', val)

def parse_date(val):
    if val is None:
        return None
    if isinstance(val, datetime.datetime) or isinstance(val, datetime.date):
        return val.isoformat()
    s = str(val).strip()
    if not s:
        return None
    # Try parsing different formats
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
        try:
            return datetime.datetime.strptime(s, fmt).isoformat()
        except ValueError:
            continue
    return None

def main():
    print("Parsing Arpit Solar Master Sheet (2).numbers...")
    doc = Document('/Users/ratneshmishra/Developer/master-app/_Arpit Solar Master Sheet (2).numbers')
    sheet = doc.sheets['MasterSheet']
    table = sheet.tables[0]

    rows = []
    # Data starts at row index 5 (1-based row 6)
    for r in range(5, table.num_rows):
        # A(0) is name. If empty, skip.
        name_cell = table.cell(r, 0).value
        if name_cell is None:
            continue
        name = clean_str(name_cell)
        if not name or "IS LINE KE NICHE" in name:
            continue

        # Extract values
        row_data = {
            "name": name,
            "callingNo": clean_str(table.cell(r, 1).value),
            "mobile": clean_str(table.cell(r, 2).value),
            "caNumber": clean_str(table.cell(r, 3).value),
            "division": normalize_division(clean_str(table.cell(r, 4).value)),
            "capacity": parse_number(table.cell(r, 5).value),
            "sourceOfLead": clean_str(table.cell(r, 6).value),
            "brandModel": clean_str(table.cell(r, 7).value),
            "referral": clean_str(table.cell(r, 8).value),
            "location": clean_str(table.cell(r, 9).value),
            "surveyStatus": clean_str(table.cell(r, 10).value),
            "amount": parse_number(table.cell(r, 11).value),
            "balance": parse_number(table.cell(r, 12).value),
            "poSigned": clean_str(table.cell(r, 13).value),
            "soldBy": clean_str(table.cell(r, 14).value),
            "invoiceDate": parse_date(table.cell(r, 15).value),
            "incStage": clean_str(table.cell(r, 16).value),
            "plantStatus": clean_str(table.cell(r, 17).value),
            "status": clean_str(table.cell(r, 18).value), # Column S (Net Meter status)
            "docSubmitted": clean_str(table.cell(r, 19).value),
            "documentStatus": clean_str(table.cell(r, 20).value),
            "meterTypeSl": clean_str(table.cell(r, 21).value),
            "statusW": clean_str(table.cell(r, 22).value), # Column W (Status )
            "sealingIndent": clean_str(table.cell(r, 23).value), # Column X
            "dcr": clean_str(table.cell(r, 24).value),
            "instDetailSub": clean_str(table.cell(r, 25).value),
            "pcr": clean_str(table.cell(r, 26).value),
            "subsidyRedeem": clean_str(table.cell(r, 27).value)
        }

        # Convert numbers stored as floats to clean string digits for CA No, Calling, Mobile if needed
        for num_field in ("callingNo", "mobile", "caNumber"):
            val = row_data[num_field]
            if val is not None:
                try:
                    # If it ends with .0, strip it
                    f_val = float(val)
                    row_data[num_field] = str(int(f_val))
                except ValueError:
                    pass

        rows.append(row_data)

    print(f"Total parsed rows: {len(rows)}")

    # Write to JSON
    output_path = '/Users/ratneshmishra/Developer/master-app/apps/web/prisma/seed_data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    print(f"Successfully wrote JSON to {output_path}")

if __name__ == "__main__":
    main()
