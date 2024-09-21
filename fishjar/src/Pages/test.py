n = int(input("value: "))
allpair = True
while n!=0:
    if n%2!=0:
        allpair = False
    n = int(input("value: "))
print(allpair)