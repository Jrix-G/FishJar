n = int(input("Votre nombre"))

total = n
days = n//(60*60*24)
total -= days*60*60*24
hours = total//(60*60)
total -= hours*60*60
minutes = total//60
total -= minutes*60
seconds = total
print(f"{days} jours, {hours} heures, {minutes} minutes et {seconds} secondes")