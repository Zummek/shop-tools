import csv

# Convert "Raport sprzedaży" file to "EDI text" file for PC-Market
def convert_file(input_file, output_file):
    lines = []
    
    with open(input_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter='\t')
        
        for row in reader:
            # Pobierz odpowiednie dane z wiersza
            nazwa = row['Nazwa']
            kod = row['Kod']
            vat = row['Stawka'].replace(' %', '')
            jm = row['Jm']
            ilosc = float(row['Ilo��'].replace(',', '.'))
            if ilosc == 0:
                continue
            wartosc = float(row['W cenie zak. netto'].replace(',', '.'))
            # round to 2 decimal places: wartosc/ilosc
            cena_netto = round(wartosc / ilosc, 2)
            
            # Stwórz nowy format dla linii
            line = f"Linia:Nazwa{{{nazwa}}}Kod{{{kod}}}Vat{{{vat}}}Jm{{{jm}}}Asortyment{{}}Sww{{}}PKWiU{{}}Ilosc{{{ilosc}}}Cena{{n{cena_netto}}}Wartosc{{n{wartosc}}}CenaSp{{}}"
            lines.append(line)

    # Zapisz plik wyjściowy
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Zapisz liczbę linii
        outfile.write(f"IloscLini:{len(lines)}\n")
        # Zapisz każdą linię
        for line in lines:
            outfile.write(line + '\n')

# Użycie skryptu
input_file = './file_in.txt'
output_file = './file_out.txt'
print(f'Converting file: {input_file} to {output_file}')
convert_file(input_file, output_file)
