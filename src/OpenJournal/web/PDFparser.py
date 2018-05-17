from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfpage import PDFPage
from io import StringIO
import os 
import PyPDF2
import json
import hashlib

def page_number_of_pdf(path):
	pdfFileObj = open(path, 'rb')
	pdfReader = PyPDF2.PdfFileReader(pdfFileObj)
	return pdfReader.numPages

def convert_pdf_to_txt(path, pages=None):
    if not pages:
        pagenums = set()
    else:
        pagenums = set(pages)
    output = StringIO()
    manager = PDFResourceManager()
    converter = TextConverter(manager, output, laparams=LAParams())
    interpreter = PDFPageInterpreter(manager, converter)

    infile = open(path, 'rb')
    
    for page in PDFPage.get_pages(infile, pagenums):
        interpreter.process_page(page)

    infile.close()
    converter.close()

    text = output.getvalue().strip()

    output.close()
    return text

def extract_reference_from_text(text):
	start = text.find('REFERENCES:')
	reference_text = " ".join(text[start:].split("\n"))
	
	reference_list = reference_text.split("[")
	reference_number_list = []
	reference_title_list = []
	
	for reference in reference_list:
		is_valid = reference.find("]")
		try:
			int(reference[:is_valid])			
		except:
			continue

		reference = reference[is_valid+1:]
		reference_detail_list = reference.split(",")
		is_openjournal_number = reference_detail_list[0].strip()

		try:
			reference_number_list.append(int(is_openjournal_number))
		except:
			continue

		start_title = reference.find("“")
		end_title = reference.find("”")

		reference_title = reference[start_title+1:end_title]
		reference_title_length = len(reference_title)

		if reference_title[reference_title_length-1] == ",":
			reference_title = reference_title[0:reference_title_length-1]
		reference_title_list.append(reference_title)

	number_length = len(reference_number_list)
	title_length = len(reference_title_list)

	if number_length != title_length:
		return -1, -1

	return reference_number_list, reference_title_list

def make_reference_hash_number(number_list, title_list):
	hash_length = len(number_list)
	hash_list = []
	hash_password = "0504110310110711"

	for i in range(0, hash_length):
		new_str = str(number_list[i])+hash_password+title_list[i]
		hash_list.append((hashlib.sha256(new_str.encode('utf-8')).hexdigest()))

	return hash_list

pdf_page = page_number_of_pdf("/Users/chaminjun/Desktop/Example.pdf")
text = convert_pdf_to_txt("/Users/chaminjun/Desktop/Example.pdf",[pdf_page-3, pdf_page-2, pdf_page-1])

reference_number_list, reference_title_list = extract_reference_from_text(text)
reference_hash_list = make_reference_hash_number(reference_number_list, reference_title_list)
print(reference_number_list)
print(reference_title_list)
print(reference_hash_list)
