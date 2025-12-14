

export const sharedStyles = new CSSStyleSheet();
sharedStyles.replaceSync(`
  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin: 0;
    border: none;
    padding: 0;
    justify-content: flex-start;
  }
.column{
  display: flex;
  flex-direction: column;
  margin: 0;
  border: none;
  padding: 0;
  justify-content: flex-start;
}
._80{width:80%;}
._20{width:20%;}
._10{width:10%;}
.full{width:100%;}
.half{width:50%;}
._50{width:50%;}
._40{width:40%;}
._33{width:30%;}
._25{width:25%;} 

`);
