# Ecrivez votre programme ci-dessous.
# Bouton Fullscreen pour passer en plein ecran
def stud():
    numbers = []
    while True:
        num = float(input("Nombre ? "))
        if num == 0:
            break
        numbers.append(num)
    
    if not numbers: 
        print("Seulement 0")
        return
    
    all_positive = all(n > 0 for n in numbers)
    all_negative = all(n < 0 for n in numbers)
    
    if all_positive:
        print("Tous +")
    elif all_negative:
        print("Tous -")
    else:
        print("Ni tous +, ni tous -")
        total_sum = sum(numbers)
        if total_sum > 0:
            print("Somme +")
        elif total_sum < 0:
            print("Somme -")
        else:
            print("Somme = 0")

stud()


