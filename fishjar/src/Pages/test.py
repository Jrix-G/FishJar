def sommeDivPropre(n):
    if n <= 1:
        return 0
    somme = 0
    for i in range(1, n // 2 + 1):
        if n % i == 0:
            somme += i
    return somme

def estParfait(n):
    return sommeDivPropre(n) == n

def parfaits_entre(binf=2, bsup=100):
    if binf > bsup:
        print("Test avec bmin > bsup")
        return
    
    print(f"Nombres parfaits de [{binf},{bsup}]")
    parfaits = [n for n in range(binf, bsup + 1) if estParfait(n)]
    if parfaits:
        print(" ".join(map(str, parfaits)))
    else:
        print("Aucun nombre parfait trouvé dans cet intervalle.")